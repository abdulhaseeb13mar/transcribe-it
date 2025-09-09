import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { DocumentService } from "../services/documentService";

type App = Hono<{ Bindings: Env; Variables: { user?: { id: string; email: string; role?: string } } }>;

const docSvc = new DocumentService();

export const registerDocumentRoutes = (app: App) => {
  // POST /api/ocr/extract — supports multipart (file) or JSON {contentBase64, fileName, mimeType, forceOcr}
  app.post("/api/ocr/extract", withSupabaseAuth(), async (c) => {
    let data: Uint8Array | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let forceOcr = false;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await c.req.formData();
      const file = form.get("file");
      if (file && file instanceof File) {
        const ab = await file.arrayBuffer();
        data = new Uint8Array(ab);
        fileName = file.name;
        mimeType = file.type || undefined;
        const fo = String(form.get("forceOcr") ?? "").toLowerCase();
        if (fo) forceOcr = ["1", "true", "yes", "on"].includes(fo);
      }
    } else if (contentType.includes("application/json")) {
      const body = await c.req.json().catch(() => ({}));
      if (body?.contentBase64) {
        const b64 = String(body.contentBase64);
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        data = bin;
        fileName = body.fileName;
        mimeType = body.mimeType;
        forceOcr = Boolean(body.forceOcr);
      }
    }

    if (!data) {
      return c.json({ success: false, error: { message: "No file provided (use multipart 'file' or JSON 'contentBase64')." } }, 400);
    }

    // query override
    const q = c.req.query("forceOcr");
    if (q) forceOcr = ["1", "true", "yes", "on"].includes(q.toLowerCase());

    const result = await docSvc.extractText(data, mimeType, fileName, { forceOcr });
    return c.json({
      success: true,
      message: "Text extracted successfully",
      data: {
        type: result.type,
        text: result.text,
        pages: result.pages,
        warnings: result.warnings,
        fileName,
        mimeType,
        forceOcr,
      },
    });
  });

  // Back-compat: POST /api/document/extract (JSON only)
  app.post("/api/document/extract", withSupabaseAuth(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const b64 = body?.contentBase64 as string | undefined;
    if (!b64) return c.json({ success: false, error: { message: "contentBase64 required" } }, 400);
    const data = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const fileName = body?.fileName as string | undefined;
    const mimeType = body?.mimeType as string | undefined;
    const forceOcr = Boolean(body?.forceOcr);
    const result = await docSvc.extractText(data, mimeType, fileName, { forceOcr });
    return c.json({ success: true, message: "Text extracted successfully", data: { type: result.type, text: result.text, pages: result.pages, warnings: result.warnings, fileName, mimeType, forceOcr } });
  });

  // POST /api/ocr/translate-text { text, sourceLang, targetLang? }
  app.post("/api/ocr/translate-text", withSupabaseAuth(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { text, sourceLang, targetLang } = body || {};
    if (!text || !sourceLang) {
      return c.json({ success: false, error: { message: "'text' and 'sourceLang' are required" } }, 400);
    }

    const result = await docSvc.translateText({ text, sourceLang, targetLang: targetLang || "en" });
    return c.json({
      success: true,
      message: "Text translated successfully",
      data: {
        translation: result.translation,
        sourceLang,
        targetLang: targetLang || "en",
      },
    });
  });

  // Back-compat: POST /api/document/translate-text
  app.post("/api/document/translate-text", withSupabaseAuth(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { text, sourceLang, targetLang } = body || {};
    if (!text || !sourceLang) {
      return c.json({ success: false, error: { message: "'text' and 'sourceLang' are required" } }, 400);
    }
    const result = await docSvc.translateText({ text, sourceLang, targetLang: targetLang || "en" });
    return c.json({ success: true, message: "Text translated successfully", data: { translation: result.translation, sourceLang, targetLang: targetLang || "en" } });
  });

  // POST /api/ocr/extract-and-translate
  app.post("/api/ocr/extract-and-translate", withSupabaseAuth(), async (c) => {
    let data: Uint8Array | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let sourceLang: string | undefined;
    let targetLang: string | undefined;
    let forceOcr = false;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await c.req.formData();
      const file = form.get("file");
      if (file && file instanceof File) {
        const ab = await file.arrayBuffer();
        data = new Uint8Array(ab);
        fileName = file.name;
        mimeType = file.type || undefined;
      }
      sourceLang = String(form.get("sourceLang") ?? "");
      targetLang = String(form.get("targetLang") ?? "" ) || undefined;
      const fo = String(form.get("forceOcr") ?? "").toLowerCase();
      if (fo) forceOcr = ["1", "true", "yes", "on"].includes(fo);
    } else if (contentType.includes("application/json")) {
      const body = await c.req.json().catch(() => ({}));
      if (body?.contentBase64) {
        const b64 = String(body.contentBase64);
        const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
        data = bin;
      }
      fileName = body.fileName;
      mimeType = body.mimeType;
      sourceLang = body.sourceLang;
      targetLang = body.targetLang;
      forceOcr = Boolean(body.forceOcr);
    }

    if (!data) {
      return c.json({ success: false, error: { message: "No file provided (use multipart 'file' or JSON 'contentBase64')." } }, 400);
    }
    if (!sourceLang) {
      return c.json({ success: false, error: { message: "'sourceLang' is required" } }, 400);
    }
    const q = c.req.query("forceOcr");
    if (q) forceOcr = ["1", "true", "yes", "on"].includes(q.toLowerCase());

    const extracted = await docSvc.extractText(data, mimeType, fileName, { forceOcr });
    const translated = await docSvc.translateText({ text: extracted.text, sourceLang, targetLang: targetLang || "en" });

    return c.json({
      success: true,
      message: "Document translated successfully",
      data: {
        translation: translated.translation,
        meta: extracted,
        fileName,
        mimeType,
        sourceLang,
        targetLang: targetLang || "en",
        forceOcr,
      },
    });
  });
};
