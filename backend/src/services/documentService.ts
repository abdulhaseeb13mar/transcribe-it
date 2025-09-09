// Note: Avoid Node-only 'path' in Worker environments.

// Lazy references; resolve dynamically at runtime when available (Node env)
let pdfParse: any;
let mammoth: any;
let Tesseract: any;
let GoogleGenAI: any;
let Type: any;

const dynamicImport = async (name: string): Promise<any | null> => {
  try {
    // Avoid bundler resolution in Workers by using Function
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const importer: any = Function("n", "return import(n)");
    return await importer(name);
  } catch {
    return null;
  }
};

export type SupportedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/webp"
  | "image/bmp"
  | "image/tiff";

export interface ExtractResult {
  text: string;
  type: "pdf" | "docx" | "image";
  pages?: number;
  warnings?: string[];
}

export interface TranslateResult {
  translation: string;
  meta?: { extractedType?: ExtractResult["type"]; warnings?: string[] };
}

export class DocumentService {
  private static readonly MIN_TEXT_LENGTH_FOR_PDF = 50;

  private getEnv(): any {
    const g: any = globalThis as any;
    return g.__APP_ENV || (typeof process !== "undefined" ? (process as any).env : {});
  }

  private getGenAiApiKey(): string | undefined {
    const env: any = this.getEnv();
    return env.GOOGLE_API_KEY || env.GENAI_API_KEY || env.API_KEY;
  }

  private hasGenAi(): boolean {
    // Consider LLM OCR available if an API key exists; we'll use fetch.
    return Boolean(this.getGenAiApiKey());
  }

  async extractText(
    fileBuffer: ArrayBuffer | Uint8Array,
    mimeType?: string,
    fileName?: string,
    opts?: { forceOcr?: boolean }
  ): Promise<ExtractResult> {
    const { getExt, toUint8 } = await import("../utils/binary");
    const ext = getExt(fileName);
    const normalizedMime = (mimeType || "").toLowerCase();
    const u8 = toUint8(fileBuffer);

    if (normalizedMime === "application/pdf" || ext === ".pdf") {
      return this.extractFromPdf(u8, opts);
    }

    if (
      normalizedMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      return this.extractFromDocx(u8);
    }

    if (
      [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/bmp",
        "image/tiff",
      ].includes(normalizedMime) || [
        ".png",
        ".jpeg",
        ".jpg",
        ".webp",
        ".bmp",
        ".tiff",
        ".tif",
      ].includes(ext)
    ) {
      return this.extractFromImage(u8);
    }

    // Fallback try order
    try {
      return await this.extractFromPdf(u8, opts);
    } catch {
      try {
        return await this.extractFromDocx(u8);
      } catch {
        return await this.extractFromImage(u8);
      }
    }
  }

  private async extractFromPdf(
    buffer: Uint8Array,
    opts?: { forceOcr?: boolean }
  ): Promise<ExtractResult> {
    const warnings: string[] = [];
    try {
      if (!pdfParse) {
        const mod = await dynamicImport("pdf-parse");
        pdfParse = mod?.default || mod;
      }
      const { maybeToNodeBuffer } = await import("../utils/binary");
      const nodeBuf = maybeToNodeBuffer(buffer);
      const data = await pdfParse(nodeBuf ?? buffer);
      let text = (data.text || "").trim();

      if (opts?.forceOcr || text.length < DocumentService.MIN_TEXT_LENGTH_FOR_PDF) {
        if (this.hasGenAi()) {
          const { uint8ToBase64 } = await import("../utils/binary");
          const base64 = uint8ToBase64(buffer);
          const llmText = await this.extractWithLlmOcr(base64, "application/pdf");
          if (llmText && llmText.trim().length > 0) {
            text = llmText.trim();
            warnings.push("Used LLM OCR fallback for PDF (Gemini)");
          } else {
            warnings.push(
              "LLM OCR fallback returned empty text. Document may be purely images or unreadable."
            );
          }
        } else {
          warnings.push(
            "No extractable text found. If this is a scanned PDF, OCR is required. Configure GOOGLE_API_KEY to enable LLM OCR."
          );
        }
      }

      return {
        type: "pdf",
        text,
        pages: data.numpages,
        warnings: warnings.length ? warnings : undefined,
      };
    } catch (e) {
      if (this.hasGenAi()) {
        const { uint8ToBase64 } = await import("../utils/binary");
        const base64 = uint8ToBase64(buffer);
        const text = await this.extractWithLlmOcr(base64, "application/pdf");
        return {
          type: "pdf",
          text: (text || "").trim(),
          warnings: [
            "pdf-parse failed; used LLM OCR fallback for PDF (Gemini)",
          ],
        };
      }
      throw e;
    }
  }

  private async extractFromDocx(buffer: Uint8Array): Promise<ExtractResult> {
    if (!mammoth) {
      const mod = await dynamicImport("mammoth");
      mammoth = mod?.default || mod;
    }
    const { maybeToNodeBuffer } = await import("../utils/binary");
    const nodeBuf = maybeToNodeBuffer(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuf ?? buffer });
    const text: string = (result.value || "").trim();
    return { type: "docx", text };
  }

  private async extractFromImage(buffer: Uint8Array): Promise<ExtractResult> {
    // Prefer LLM OCR for images when available
    if (this.hasGenAi()) {
      const { uint8ToBase64 } = await import("../utils/binary");
      const base64 = uint8ToBase64(buffer);
      const text = await this.extractWithLlmOcr(base64, "image/jpeg");
      return { type: "image", text: (text || "").trim() };
    }
    if (!Tesseract) {
      const mod = await dynamicImport("tesseract.js");
      Tesseract = mod?.default || mod;
    }
    if (Tesseract) {
      const { maybeToNodeBuffer } = await import("../utils/binary");
      const nodeBuf = maybeToNodeBuffer(buffer);
      const { data } = await Tesseract.recognize(nodeBuf ?? buffer, "eng");
      const text: string = (data?.text || "").trim();
      return { type: "image", text };
    }
    throw new Error(
      "OCR engine not available. Install 'tesseract.js' or configure GOOGLE_API_KEY to enable LLM OCR."
    );
  }

  private async extractWithLlmOcr(
    base64Content: string,
    mimeType: string
  ): Promise<string> {
    const apiKey = this.getGenAiApiKey();
    if (!apiKey) throw new Error("LLM OCR not available. Set GOOGLE_API_KEY/GENAI_API_KEY.");
    const env: any = this.getEnv();
    const model = (env.GENAI_MODEL as string) || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Content } },
            { text: "Extract all text from this document. If no text is present, return an empty response." },
          ],
        },
      ],
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      if (mimeType === "application/pdf") {
        const retry = {
          contents: [
            {
              parts: [
                { inlineData: { mimeType: "image/jpeg", data: base64Content } },
                { text: "This file may be an image-wrapped PDF. Perform OCR and extract any text." },
              ],
            },
          ],
        };
        const r2 = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(retry) });
        const j2: any = await r2.json().catch(() => ({}));
        if (r2.ok) return this.parseGeminiText(j2);
      }
      const msg = json?.error?.message || resp.statusText || "LLM OCR request failed";
      throw new Error(msg);
    }
    return this.parseGeminiText(json);
  }

  private parseGeminiText(resp: any): string {
    try {
      const c = resp?.candidates?.[0];
      const parts = c?.content?.parts || [];
      const texts = parts.map((p: any) => (typeof p.text === "string" ? p.text : "")).filter(Boolean);
      return (texts.join("\n") || "").toString();
    } catch {
      return "";
    }
  }

  async translateText(params: {
    text: string;
    sourceLang: string;
    targetLang?: string; // defaults to 'en'
  }): Promise<TranslateResult> {
    const apiKey = this.getGenAiApiKey();
    if (!apiKey) throw new Error("Google GenAI API key not configured. Set GOOGLE_API_KEY or GENAI_API_KEY or API_KEY.");
    const { text, sourceLang, targetLang = "en" } = params;
    const env: any = this.getEnv();
    const model = (env.GENAI_MODEL as string) || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const prompt = `Translate the following document from ${sourceLang} to ${targetLang}. Output ONLY Markdown preserving structure (headings, lists, tables, emphasis). No commentary.\n\n---\n${text}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = json?.error?.message || resp.statusText || "Translation request failed";
      throw new Error(msg);
    }
    const translation = this.parseGeminiText(json);
    return { translation };
  }

  async extractAndTranslate(params: {
    buffer: ArrayBuffer | Uint8Array;
    mimeType?: string;
    fileName?: string;
    sourceLang: string;
    targetLang?: string; // defaults to 'en'
    forceOcr?: boolean;
  }): Promise<{ translation: string; meta: ExtractResult }> {
    const { buffer, mimeType, fileName, sourceLang, targetLang = "en", forceOcr } = params;
    const extracted = await this.extractText(buffer, mimeType, fileName, { forceOcr });
    const translated = await this.translateText({ text: extracted.text, sourceLang, targetLang });
    return { translation: translated.translation, meta: extracted };
  }
}
