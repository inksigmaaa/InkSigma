import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
const FALLBACK_STATUS_CODES = new Set([404, 429, 500, 502, 503, 504]);

const requestSchema = z.object({
  action: z.literal("fix_grammar"),
  text: z.string().trim().min(1).max(5_000),
});

const stripHtml = (text: string) =>
  text.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

const decodeBasicHtmlEntities = (text: string) =>
  text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

const cleanModelText = (text: string) => {
  const withoutFence = text
    .trim()
    .replace(/^```(?:html|text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^(?:corrected text|fixed text|suggestion):\s*/i, "");

  const decoded = decodeBasicHtmlEntities(withoutFence);
  const withoutHtml = stripHtml(decoded);

  return withoutHtml || withoutFence.trim();
};

const getGeminiText = (data: unknown) => {
  if (
    data &&
    typeof data === "object" &&
    "candidates" in data &&
    Array.isArray(data.candidates)
  ) {
    const parts = data.candidates[0]?.content?.parts;
    if (!Array.isArray(parts)) return "";

    return parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
};

const buildGeminiBody = (selectedText: string) =>
  JSON.stringify({
    system_instruction: {
      parts: [
        {
          text: "You are an expert writing assistant embedded inside InkSigma, a blog writing editor. Return only the corrected text. Do not add explanations, labels, markdown fences, HTML tags, or surrounding quotes. Preserve the original meaning, tone, language, proper nouns, and formatting as much as possible.",
        },
      ],
    },
    contents: [
      {
        parts: [
          {
            text: `Fix grammar, spelling, punctuation, and sentence structure errors in the text below. Keep meaning and tone identical. Only fix errors; do not rewrite. Return plain text only.\n\nTEXT:\n${selectedText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1200,
    },
  });

const requestGemini = async ({
  apiKey,
  model,
  selectedText,
}: {
  apiKey: string;
  model: string;
  selectedText: string;
}) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: buildGeminiBody(selectedText),
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return { response, data, contentType };
};

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Fix grammar action and selected text are required", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError("Writing assistant is not configured", 503);
    }

    const selectedText = stripHtml(parsed.data.text);
    if (!selectedText) {
      throw new AppError("Selected text is empty", 400);
    }

    let activeModel = GEMINI_MODEL;
    let { response, data, contentType } = await requestGemini({
      apiKey,
      model: activeModel,
      selectedText,
    });

    let text = response.ok ? cleanModelText(getGeminiText(data)) : "";

    if (
      GEMINI_FALLBACK_MODEL &&
      GEMINI_FALLBACK_MODEL !== activeModel &&
      (!response.ok || !text) &&
      (response.ok || FALLBACK_STATUS_CODES.has(response.status))
    ) {
      logger.warn(
        {
          status: response.status,
          provider: "gemini",
          model: activeModel,
          fallbackModel: GEMINI_FALLBACK_MODEL,
          action: parsed.data.action,
          contentType,
        },
        "Gemini writing assistant using fallback model",
      );

      activeModel = GEMINI_FALLBACK_MODEL;
      ({ response, data, contentType } = await requestGemini({
        apiKey,
        model: activeModel,
        selectedText,
      }));
      text = response.ok ? cleanModelText(getGeminiText(data)) : "";
    }

    if (!response.ok) {
      logger.warn(
        {
          status: response.status,
          provider: "gemini",
          model: activeModel,
          action: parsed.data.action,
          contentType,
        },
        "Gemini writing assistant request failed",
      );

      throw new AppError("Writing assistant failed. Please try again.", 502);
    }

    if (!text) {
      throw new AppError("Writing assistant returned no suggestion", 502);
    }

    res.json({
      text,
      action: parsed.data.action,
      provider: "gemini",
      model: activeModel,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
