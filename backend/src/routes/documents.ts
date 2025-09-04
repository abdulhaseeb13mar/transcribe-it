import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { ValidationError } from "../utils/errors";
import { DocumentService } from "../services/documentService";
import { authenticateUser } from "../middleware/supabaseAuth";

// Multer is optional at author time; if not installed here, we gracefully fallback to base64 input.
let multer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  multer = require("multer");
} catch { }

const router: IRouter = Router();
const documentService = new DocumentService();

// If multer is available, configure it for in-memory storage
const upload = multer ? multer({ storage: multer.memoryStorage() }) : null;

// POST /api/ocr/extract
// Accepts either:
// 1) multipart/form-data with field name "file"
// 2) JSON { contentBase64: string, fileName?: string, mimeType?: string }
const handler = asyncHandler(async (req: Request, res: Response) => {
  let buffer: Buffer | null = null;
  let fileName: string | undefined;
  let mimeType: string | undefined;
  let forceOcr = false;

  if ((req as any).file) {
    const f = (req as any).file as any;
    buffer = f.buffer;
    fileName = f.originalname;
    mimeType = f.mimetype;
  } else if (req.is("application/json")) {
    const { contentBase64, mimeType: mt, fileName: fn, forceOcr: fo } = req.body || {};
    if (!contentBase64) {
      throw new ValidationError(
        "Missing 'contentBase64' in JSON body when not using multipart upload"
      );
    }
    try {
      buffer = Buffer.from(contentBase64, "base64");
      fileName = fn;
      mimeType = mt;
      forceOcr = Boolean(fo);
    } catch (e) {
      throw new ValidationError("Invalid base64 content");
    }
  }

  if (!buffer) {
    throw new ValidationError(
      upload
        ? "No file provided. Use 'file' field in multipart/form-data or provide JSON with 'contentBase64'."
        : "No file provided. Provide JSON with 'contentBase64' since multipart parser is unavailable."
    );
  }

  // Query param also supported: /extract?forceOcr=true
  if (typeof (req.query.forceOcr as any) !== "undefined") {
    const q = String(req.query.forceOcr);
    forceOcr = ["1", "true", "yes", "on"].includes(q.toLowerCase());
  }

  const result = await documentService.extractText(buffer, mimeType, fileName, { forceOcr });
  sendResponse(res, 200, true, "Text extracted successfully", {
    type: result.type,
    text: result.text,
    pages: result.pages,
    warnings: result.warnings,
    fileName,
    mimeType,
    forceOcr,
  });
});

if (upload) {
  // Multipart path when multer is present
  router.post("/extract", authenticateUser, (upload as any).single("file"), handler);
} else {
  // JSON-only path when multer is not available in this environment
  router.post("/extract", authenticateUser, handler);
}

// POST /api/ocr/translate-text
// JSON body: { text, sourceLang, targetLang? } targetLang defaults to 'en'
router.post(
  "/translate-text",
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const { text, sourceLang, targetLang } = req.body || {};
    if (!text || !sourceLang) {
      throw new ValidationError("'text' and 'sourceLang' are required");
    }
    const result = await documentService.translateText({
      text,
      sourceLang,
      targetLang: targetLang || "en",
    });
    sendResponse(res, 200, true, "Text translated successfully", {
      translation: result.translation,
      sourceLang,
      targetLang: targetLang || "en",
    });
  })
);

// POST /api/ocr/extract-and-translate
// Accepts same inputs as /extract plus sourceLang, optional targetLang (defaults to 'en')
const extractAndTranslateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    let buffer: Buffer | null = null;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let sourceLang: string | undefined;
    let targetLang: string | undefined;
    let forceOcr = false;

    if ( (req as any).file ) {
      const f = (req as any).file as any;
      buffer = f.buffer;
      fileName = f.originalname;
      mimeType = f.mimetype;
      sourceLang = (req.body?.sourceLang as string) || undefined;
      targetLang = (req.body?.targetLang as string) || undefined;
      forceOcr = ["1", "true", "yes", "on"].includes(
        String(req.body?.forceOcr || "").toLowerCase()
      );
    } else if (req.is("application/json")) {
      const {
        contentBase64,
        mimeType: mt,
        fileName: fn,
        sourceLang: sl,
        targetLang: tl,
        forceOcr: fo,
      } = req.body || {};
      if (!contentBase64) {
        throw new ValidationError(
          "Missing 'contentBase64' in JSON body when not using multipart upload"
        );
      }
      try {
        buffer = Buffer.from(contentBase64, "base64");
        fileName = fn;
        mimeType = mt;
        sourceLang = sl;
        targetLang = tl;
        forceOcr = Boolean(fo);
      } catch (e) {
        throw new ValidationError("Invalid base64 content");
      }
    }

    if (!buffer) {
      throw new ValidationError(
        upload
          ? "No file provided. Use 'file' field in multipart/form-data or JSON with 'contentBase64'."
          : "No file provided. Provide JSON with 'contentBase64' since multipart parser is unavailable."
      );
    }
    if (!sourceLang) {
      throw new ValidationError("'sourceLang' is required");
    }

    // Query param override for forceOcr
    if (typeof (req.query.forceOcr as any) !== "undefined") {
      const q = String(req.query.forceOcr);
      forceOcr = ["1", "true", "yes", "on"].includes(q.toLowerCase());
    }

    const result = await documentService.extractAndTranslate({
      buffer: buffer as Buffer,
      fileName,
      mimeType,
      sourceLang,
      targetLang: targetLang || "en",
      forceOcr,
    });

    sendResponse(res, 200, true, "Document translated successfully", {
      translation: result.translation,
      meta: result.meta,
      fileName,
      mimeType,
      sourceLang,
      targetLang: targetLang || "en",
      forceOcr,
    });
  }
);

if (upload) {
  router.post(
    "/extract-and-translate",
    authenticateUser,
    (upload as any).single("file"),
    extractAndTranslateHandler
  );
} else {
  router.post("/extract-and-translate", authenticateUser, extractAndTranslateHandler);
}

export default router;
