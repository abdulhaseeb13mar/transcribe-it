import path from "path";

// Lazy requires to keep compile-time light; runtime must have deps installed
let pdfParse: any;
let mammoth: any;
let Tesseract: any;
let GoogleGenAI: any;
let Type: any;

try {
  pdfParse = require("pdf-parse");
} catch { }
try {
  mammoth = require("mammoth");
} catch { }
try {
  Tesseract = require("tesseract.js");
} catch { }
try {
  const mod = require("@google/genai");
  GoogleGenAI = mod.GoogleGenAI;
  Type = mod.Type;
} catch { }

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

  private getGenAiApiKey(): string | undefined {
    return (
      process.env.GOOGLE_API_KEY ||
      process.env.GENAI_API_KEY ||
      process.env.API_KEY
    );
  }

  private hasGenAi(): boolean {
    return Boolean(GoogleGenAI) && Boolean(this.getGenAiApiKey());
  }

  async extractText(
    fileBuffer: Buffer,
    mimeType?: string,
    fileName?: string,
    opts?: { forceOcr?: boolean }
  ): Promise<ExtractResult> {
    const ext = (fileName ? path.extname(fileName) : "").toLowerCase();
    const normalizedMime = (mimeType || "").toLowerCase();

    if (normalizedMime === "application/pdf" || ext === ".pdf") {
      return this.extractFromPdf(fileBuffer, opts);
    }

    if (
      normalizedMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      return this.extractFromDocx(fileBuffer);
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
      return this.extractFromImage(fileBuffer);
    }

    // Fallback try order
    try {
      return await this.extractFromPdf(fileBuffer, opts);
    } catch {
      try {
        return await this.extractFromDocx(fileBuffer);
      } catch {
        return await this.extractFromImage(fileBuffer);
      }
    }
  }

  private async extractFromPdf(
    buffer: Buffer,
    opts?: { forceOcr?: boolean }
  ): Promise<ExtractResult> {
    if (!pdfParse) {
      throw new Error(
        "PDF parser not available. Please install 'pdf-parse'."
      );
    }
    const warnings: string[] = [];
    try {
      const data = await pdfParse(buffer);
      let text = (data.text || "").trim();

      if (opts?.forceOcr || text.length < DocumentService.MIN_TEXT_LENGTH_FOR_PDF) {
        if (this.hasGenAi()) {
          const base64 = buffer.toString("base64");
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
        const base64 = buffer.toString("base64");
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

  private async extractFromDocx(buffer: Buffer): Promise<ExtractResult> {
    if (!mammoth) {
      throw new Error(
        "DOCX parser not available. Please install 'mammoth'."
      );
    }
    const result = await mammoth.extractRawText({ buffer });
    const text: string = (result.value || "").trim();
    return { type: "docx", text };
  }

  private async extractFromImage(buffer: Buffer): Promise<ExtractResult> {
    // Prefer LLM OCR for images when available
    if (this.hasGenAi()) {
      const base64 = buffer.toString("base64");
      const text = await this.extractWithLlmOcr(base64, "image/jpeg");
      return { type: "image", text: (text || "").trim() };
    }
    if (!Tesseract) {
      throw new Error(
        "OCR engine not available. Install 'tesseract.js' or configure GOOGLE_API_KEY for LLM OCR."
      );
    }
    const { data } = await Tesseract.recognize(buffer, "eng");
    const text: string = (data?.text || "").trim();
    return { type: "image", text };
  }

  private async extractWithLlmOcr(
    base64Content: string,
    mimeType: string
  ): Promise<string> {
    const apiKey = this.getGenAiApiKey();
    if (!GoogleGenAI || !apiKey) {
      throw new Error(
        "LLM OCR not available. Install '@google/genai' and set GOOGLE_API_KEY/GENAI_API_KEY."
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
      const filePart = { inlineData: { mimeType, data: base64Content } };
      const textPart = {
        text: "Extract all text from this document. If no text is present, return an empty response.",
      };
      const response = await ai.models.generateContent({
        model: process.env.GENAI_MODEL || "gemini-2.5-flash",
        contents: { parts: [filePart, textPart] },
      });
      const r: any = response as any;
      const text = typeof r.text === "function" ? await r.text() : r.text;
      return (text || "").toString();
    } catch (error: any) {
      const message = (error?.message || "").toString();
      if (mimeType === "application/pdf" && message.includes("INVALID_ARGUMENT")) {
        const response = await new GoogleGenAI({ apiKey }).models.generateContent({
          model: process.env.GENAI_MODEL || "gemini-2.5-flash",
          contents: {
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Content } },
              {
                text: "This file was sent as a PDF but failed to process. It might be an image-wrapped PDF. Perform OCR and extract any text.",
              },
            ],
          },
        });
        const r: any = response as any;
        const text = typeof r.text === "function" ? await r.text() : r.text;
        return (text || "").toString();
      }
      throw error;
    }
  }

  async translateText(params: {
    text: string;
    sourceLang: string;
    targetLang?: string; // defaults to 'en'
  }): Promise<TranslateResult> {
    if (!GoogleGenAI || !Type) {
      throw new Error(
        "@google/genai not available. Install dependency and set GOOGLE_API_KEY/GENAI_API_KEY."
      );
    }
    const apiKey = this.getGenAiApiKey();
    if (!apiKey) {
      throw new Error(
        "Google GenAI API key not configured. Set GOOGLE_API_KEY or GENAI_API_KEY or API_KEY."
      );
    }
    const ai = new GoogleGenAI({ apiKey });
    const { text, sourceLang, targetLang = "en" } = params;

    const translationSchema = {
      type: Type.OBJECT,
      properties: {
        translation: {
          type: Type.STRING,
          description:
            "The translated content as Markdown that preserves the document's layout and structure (headings, lists, tables, emphasis).",
        },
      },
      required: ["translation"],
    };

    const jsonConfig = {
      responseMimeType: "application/json",
      responseSchema: translationSchema,
    };

    const prompt = `Task: Translate the following document from ${sourceLang} to ${targetLang} and output ONLY Markdown that preserves the original layout and structure.

      Requirements:
      - Maintain document hierarchy and structure: headings, subheadings, paragraphs.
      - Preserve lists (ordered/unordered), blockquotes, and code blocks.
      - Represent tables using GitHub-flavored Markdown tables when applicable.
      - Preserve emphasis (bold/italic), inline code, and line breaks.
      - Do not add commentary. Do not include prefaces or explanations.
      - Return the result strictly in the JSON schema with the Markdown in the 'translation' field.

      Content to translate:
---
${text}`;

    const response = await ai.models.generateContent({
      model: process.env.GENAI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: jsonConfig,
    });

    const r: any = response as any;
    const raw = typeof r.text === "function" ? await r.text() : r.text;
    let translation = "";
    try {
      const parsed = JSON.parse(String(raw || "{}"));
      if (typeof parsed.translation === "string") {
        translation = parsed.translation;
      } else {
        throw new Error(
          "'translation' field missing or not a string in AI response"
        );
      }
    } catch (e) {
      throw new Error(
        `Invalid JSON response from translation model: ${String(raw)}`
      );
    }

    return { translation };
  }

  async extractAndTranslate(params: {
    buffer: Buffer;
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
