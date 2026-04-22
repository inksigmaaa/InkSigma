import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { getRedisClient } from "../config/redis.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
const FALLBACK_STATUS_CODES = new Set([404, 429, 500, 502, 503, 504]);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 30);
const AI_RATE_LIMIT_WINDOW_SECONDS = Number(
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS || 60 * 60,
);
const AI_RATE_LIMIT_WINDOW_MS = AI_RATE_LIMIT_WINDOW_SECONDS * 1000;
const aiLocalHits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiLocalHits.entries()) {
    if (now >= entry.resetAt) {
      aiLocalHits.delete(key);
    }
  }
}, AI_RATE_LIMIT_WINDOW_MS).unref();

const writingActions = {
  fix_grammar: {
    label: "Fix Grammar",
    instruction:
      "Fix grammar, spelling, punctuation, and sentence structure errors in the text below. Keep meaning and tone identical. Only fix errors; do not rewrite.",
  },
  improve_writing: {
    label: "Improve Writing",
    instruction:
      "Rewrite the text below so it flows better, reads more naturally, and has clearer word choice. Keep the same meaning and approximate length.",
  },
  make_shorter: {
    label: "Make Shorter",
    instruction:
      "Condense the text below to be shorter. Keep all key ideas. Remove redundancy, filler words, and repeated phrasing.",
  },
  make_longer: {
    label: "Make Longer",
    instruction:
      "Expand the text below with useful detail and smoother transitions. Stay on the same topic and do not add unsupported facts.",
  },
  fix_transcription: {
    label: "Fix Voice Text",
    instruction:
      "The text below may be voice-to-text output. Fix missing punctuation, wrong words that sound similar, run-on sentences, missing capitalization, and filler words. Do not change the meaning.",
  },
  tone_formal: {
    label: "Formal Tone",
    instruction:
      "Rewrite the text below in a formal tone. Keep the same meaning and only change tone and style.",
  },
  tone_casual: {
    label: "Casual Tone",
    instruction:
      "Rewrite the text below in a casual, natural tone. Keep the same meaning and only change tone and style.",
  },
  tone_professional: {
    label: "Professional Tone",
    instruction:
      "Rewrite the text below in a polished professional tone. Keep the same meaning and only change tone and style.",
  },
} as const;

const writingActionKeys = Object.keys(writingActions) as [
  keyof typeof writingActions,
  ...(keyof typeof writingActions)[],
];

const requestSchema = z.object({
  action: z.enum(writingActionKeys),
  text: z.string().trim().min(1).max(5_000),
  stream: z.boolean().optional(),
});

type WritingActionKey = keyof typeof writingActions;

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
    .replace(/&#0?39;/gi, "'");

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

const setAiRateLimitHeaders = (
  res: express.Response,
  remaining: number,
  retryAfterSeconds = 0,
) => {
  res.setHeader("X-AI-RateLimit-Limit", AI_RATE_LIMIT_MAX);
  res.setHeader("X-AI-RateLimit-Remaining", Math.max(0, remaining));
  if (retryAfterSeconds > 0) {
    res.setHeader("Retry-After", retryAfterSeconds);
  }
};

const applyLocalAiRateLimit = (userId: string, res: express.Response) => {
  const now = Date.now();
  const entry = aiLocalHits.get(userId);

  if (!entry || now >= entry.resetAt) {
    aiLocalHits.set(userId, {
      count: 1,
      resetAt: now + AI_RATE_LIMIT_WINDOW_MS,
    });
    setAiRateLimitHeaders(res, AI_RATE_LIMIT_MAX - 1);
    return true;
  }

  if (entry.count >= AI_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000),
    );
    setAiRateLimitHeaders(res, 0, retryAfterSeconds);
    return false;
  }

  entry.count += 1;
  setAiRateLimitHeaders(res, AI_RATE_LIMIT_MAX - entry.count);
  return true;
};

const applyAiRateLimit = async (req: express.Request, res: express.Response) => {
  const userId = String(req.user?.id || req.ip || "unknown");
  const redisClient = getRedisClient();

  if (!redisClient) {
    return applyLocalAiRateLimit(userId, res);
  }

  try {
    const windowBucket = Math.floor(Date.now() / AI_RATE_LIMIT_WINDOW_MS);
    const key = `ratelimit:ai-writing:${userId}:${windowBucket}`;
    const currentCount = Number(await redisClient.incr(key));

    if (currentCount === 1) {
      await redisClient.expire(key, AI_RATE_LIMIT_WINDOW_SECONDS);
    }

    setAiRateLimitHeaders(res, AI_RATE_LIMIT_MAX - currentCount);
    return currentCount <= AI_RATE_LIMIT_MAX;
  } catch (error) {
    logger.warn(error, "AI writing rate limiter failed; using local fallback");
    return applyLocalAiRateLimit(userId, res);
  }
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

const getGeminiChunkText = (data: unknown) => {
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
      .join("");
  }

  return "";
};

const getGeminiErrorText = (data: unknown) => {
  if (!data) return "";

  if (typeof data === "string") {
    return data.trim().slice(0, 500);
  }

  if (typeof data === "object" && "error" in data) {
    const error = data.error;

    if (error && typeof error === "object" && "message" in error) {
      const message = error.message;
      return typeof message === "string" ? message.trim().slice(0, 500) : "";
    }
  }

  return "";
};

const getGeminiFailureMessage = ({
  status,
  data,
  model,
  primaryStatus,
}: {
  status: number;
  data?: unknown;
  model: string;
  primaryStatus?: number;
}) => {
  const providerMessage = getGeminiErrorText(data);
  const suffix = providerMessage ? ` Gemini says: ${providerMessage}` : "";

  if (primaryStatus === 429) {
    return `Gemini rate limit reached for the primary model, and fallback model ${model} also failed.${suffix}`;
  }

  if (status === 429) {
    return `Gemini rate limit reached for ${model}. Please try again later or use a key with more quota.${suffix}`;
  }

  if (status === 401 || status === 403) {
    return `Gemini API key is invalid or not allowed for ${model}. Check GEMINI_API_KEY in Render.${suffix}`;
  }

  if (status === 404) {
    return `Gemini model ${model} is not available. Check GEMINI_MODEL in Render.${suffix}`;
  }

  if (status === 503) {
    return `Gemini model ${model} is temporarily unavailable. Please try again shortly.${suffix}`;
  }

  return `Gemini request failed for ${model}.${suffix}`;
};

const getGeminiClientStatus = (status: number, primaryStatus?: number) => {
  if (primaryStatus === 429 || status === 429) return 429;
  if (status === 401 || status === 403 || status === 404) return 503;
  if (status === 503) return 503;
  return 502;
};

const readGeminiFailure = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return { data, contentType, status: response.status };
};

const buildGeminiBody = ({
  action,
  selectedText,
}: {
  action: WritingActionKey;
  selectedText: string;
}) =>
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
            text: `${writingActions[action].instruction} Return plain text only.\n\nTEXT:\n${selectedText}`,
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
  action,
  selectedText,
}: {
  apiKey: string;
  model: string;
  action: WritingActionKey;
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
      body: buildGeminiBody({ action, selectedText }),
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return { response, data, contentType };
};

const requestGeminiStream = async ({
  apiKey,
  model,
  action,
  selectedText,
}: {
  apiKey: string;
  model: string;
  action: WritingActionKey;
  selectedText: string;
}) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: buildGeminiBody({ action, selectedText }),
    },
  );

  return response;
};

const sendSse = (
  res: express.Response,
  event: string,
  data: Record<string, unknown>,
) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const streamGeminiToClient = async ({
  response,
  res,
}: {
  response: Response;
  res: express.Response;
}) => {
  if (!response.body) {
    throw new AppError("Writing assistant stream was empty", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";

    for (const message of messages) {
      const dataLine = message
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!dataLine) continue;

      const payload = dataLine.replace(/^data:\s*/, "");
      if (!payload || payload === "[DONE]") continue;

      let data: unknown;
      try {
        data = JSON.parse(payload);
      } catch {
        continue;
      }

      const chunkText = getGeminiChunkText(data);
      if (!chunkText) continue;

      fullText += chunkText;
      sendSse(res, "chunk", { text: chunkText });
    }
  }

  return cleanModelText(fullText);
};

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Action and selected text are required", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError("Writing assistant is not configured", 503);
    }

    const selectedText = stripHtml(parsed.data.text);
    if (!selectedText) {
      throw new AppError("Selected text is empty", 400);
    }

    const allowed = await applyAiRateLimit(req, res);
    if (!allowed) {
      throw new AppError("AI request limit reached. Please try again later.", 429);
    }

    if (parsed.data.stream) {
      let activeModel = GEMINI_MODEL;
      let response = await requestGeminiStream({
        apiKey,
        model: activeModel,
        action: parsed.data.action,
        selectedText,
      });
      let primaryFailure:
        | { status: number; data: unknown; contentType: string; model: string }
        | null = null;

      if (
        !response.ok &&
        GEMINI_FALLBACK_MODEL &&
        GEMINI_FALLBACK_MODEL !== activeModel &&
        FALLBACK_STATUS_CODES.has(response.status)
      ) {
        const failure = await readGeminiFailure(response);
        primaryFailure = {
          ...failure,
          model: activeModel,
        };

        logger.warn(
          {
            status: failure.status,
            provider: "gemini",
            model: activeModel,
            fallbackModel: GEMINI_FALLBACK_MODEL,
            action: parsed.data.action,
            contentType: failure.contentType,
            providerMessage: getGeminiErrorText(failure.data),
          },
          "Gemini writing assistant stream using fallback model",
        );

        activeModel = GEMINI_FALLBACK_MODEL;
        response = await requestGeminiStream({
          apiKey,
          model: activeModel,
          action: parsed.data.action,
          selectedText,
        });
      }

      if (!response.ok) {
        const failure = await readGeminiFailure(response);
        const providerMessage = getGeminiFailureMessage({
          status: failure.status,
          data: failure.data,
          model: activeModel,
          primaryStatus: primaryFailure?.status,
        });

        logger.warn(
          {
            status: failure.status,
            provider: "gemini",
            model: activeModel,
            primaryStatus: primaryFailure?.status,
            primaryModel: primaryFailure?.model,
            action: parsed.data.action,
            contentType: failure.contentType,
            providerMessage: getGeminiErrorText(failure.data),
          },
          "Gemini writing assistant stream request failed",
        );

        throw new AppError(
          providerMessage,
          getGeminiClientStatus(failure.status, primaryFailure?.status),
        );
      }

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      sendSse(res, "start", {
        action: parsed.data.action,
        label: writingActions[parsed.data.action].label,
        provider: "gemini",
        model: activeModel,
      });

      try {
        const text = await streamGeminiToClient({ response, res });

        if (!text) {
          sendSse(res, "error", {
            error: "Writing assistant returned no suggestion",
          });
          res.end();
          return;
        }

        sendSse(res, "done", {
          text,
          action: parsed.data.action,
          label: writingActions[parsed.data.action].label,
          provider: "gemini",
          model: activeModel,
        });
        res.end();
        return;
      } catch (error) {
        logger.warn(error, "Gemini writing assistant stream interrupted");
        sendSse(res, "error", {
          error: "Streaming interrupted. You can retry the suggestion.",
        });
        res.end();
        return;
      }
    }

    let activeModel = GEMINI_MODEL;
    let { response, data, contentType } = await requestGemini({
      apiKey,
      model: activeModel,
      action: parsed.data.action,
      selectedText,
    });
    const primaryFailure =
      !response.ok && FALLBACK_STATUS_CODES.has(response.status)
        ? { status: response.status, data, contentType, model: activeModel }
        : null;

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
          providerMessage: getGeminiErrorText(data),
        },
        "Gemini writing assistant using fallback model",
      );

      activeModel = GEMINI_FALLBACK_MODEL;
      ({ response, data, contentType } = await requestGemini({
        apiKey,
        model: activeModel,
        action: parsed.data.action,
        selectedText,
      }));
      text = response.ok ? cleanModelText(getGeminiText(data)) : "";
    }

    if (!response.ok) {
      const providerMessage = getGeminiFailureMessage({
        status: response.status,
        data,
        model: activeModel,
        primaryStatus: primaryFailure?.status,
      });

      logger.warn(
        {
          status: response.status,
          provider: "gemini",
          model: activeModel,
          primaryStatus: primaryFailure?.status,
          primaryModel: primaryFailure?.model,
          action: parsed.data.action,
          contentType,
          providerMessage: getGeminiErrorText(data),
        },
        "Gemini writing assistant request failed",
      );

      throw new AppError(
        providerMessage,
        getGeminiClientStatus(response.status, primaryFailure?.status),
      );
    }

    if (!text) {
      throw new AppError("Writing assistant returned no suggestion", 502);
    }

    res.json({
      text,
      action: parsed.data.action,
      label: writingActions[parsed.data.action].label,
      provider: "gemini",
      model: activeModel,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
