import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const router = express.Router();

const GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
const maxFileMb = Number(process.env.TRANSCRIPTION_MAX_FILE_MB || 25);
const maxFileSize = Math.max(1, maxFileMb) * 1024 * 1024;

const allowedMimeTypes = new Set([
  "audio/flac",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/ogg",
  "audio/wav",
  "audio/wave",
  "audio/webm",
  "audio/x-m4a",
  "audio/x-wav",
  "application/ogg",
  "video/mp4",
  "video/webm",
]);

const allowedExtensions = new Set([
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "ogg",
  "wav",
  "webm",
]);

const extensionByMimeType = new Map([
  ["audio/flac", "flac"],
  ["audio/mp4", "m4a"],
  ["audio/mpeg", "mp3"],
  ["audio/mpga", "mpga"],
  ["audio/ogg", "ogg"],
  ["audio/wav", "wav"],
  ["audio/wave", "wav"],
  ["audio/webm", "webm"],
  ["audio/x-m4a", "m4a"],
  ["audio/x-wav", "wav"],
  ["application/ogg", "ogg"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension =
      file.originalname.split(".").pop()?.toLowerCase() || "";
    const hasAllowedMimeType = allowedMimeTypes.has(file.mimetype);
    const hasAllowedExtension = allowedExtensions.has(extension);

    if (hasAllowedMimeType && hasAllowedExtension) {
      cb(null, true);
      return;
    }

    cb(
      new AppError(
        "Unsupported audio format. Please record or upload WebM, WAV, MP3, M4A, OGG, FLAC, or MP4 audio.",
        400,
      ),
    );
  },
});

const getSafeFilename = (file: Express.Multer.File) => {
  const rawExtension =
    file.originalname.split(".").pop()?.toLowerCase() ||
    extensionByMimeType.get(file.mimetype) ||
    "webm";
  const extension = allowedExtensions.has(rawExtension)
    ? rawExtension
    : extensionByMimeType.get(file.mimetype) || "webm";

  return `voice-recording.${extension}`;
};

const getTranscriptionText = (data: unknown) => {
  if (typeof data === "string") return data.trim();
  if (
    data &&
    typeof data === "object" &&
    "text" in data &&
    typeof data.text === "string"
  ) {
    return data.text.trim();
  }

  return "";
};

const transcribeWithGroq = async ({
  file,
  language,
}: {
  file: Express.Multer.File;
  language?: string;
}) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AppError("Transcription service is not configured", 503);
  }

  const formData = new FormData();
  const audioBuffer = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([audioBuffer], {
    type: file.mimetype || "application/octet-stream",
  });

  formData.append("file", blob, getSafeFilename(file));
  formData.append("model", GROQ_TRANSCRIPTION_MODEL);
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    logger.warn(
      {
        status: response.status,
        provider: "groq",
        model: GROQ_TRANSCRIPTION_MODEL,
        contentType,
      },
      "Groq transcription request failed",
    );

    throw new AppError("Transcription failed. Please try again.", 502);
  }

  const text = getTranscriptionText(data);
  if (!text) {
    throw new AppError("No speech was detected in the recording.", 422);
  }

  return text;
};

router.post("/", requireAuth, upload.single("audio"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Audio file is required", 400);
    }

    const language =
      typeof req.body?.language === "string" &&
      /^[a-z]{2}$/.test(req.body.language)
        ? req.body.language
        : undefined;

    const text = await transcribeWithGroq({
      file: req.file,
      language,
    });

    res.json({
      text,
      provider: "groq",
      model: GROQ_TRANSCRIPTION_MODEL,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
