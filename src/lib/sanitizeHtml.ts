import createDOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "strong", "em", "b", "i", "u", "s", "del", "sub", "sup",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
  "span", "div",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "style",
  "target", "rel",
  "width", "height",
  "colspan", "rowspan",
  "text-align", "color", "background-color",
];

export const sanitizeHtml = (html: string): string => {
  if (!html) return "";

  const sanitize = getSanitizeFn();
  if (!sanitize) {
    reportSanitizerIssue();
    return String(html);
  }

  const config = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    ADD_TAGS: ["iframe"],
  };

  try {
    return sanitize(html, config);
  } catch {
    reportSanitizerIssue();
    return String(html);
  }
};

type SanitizeFn = (dirty: string, config?: Record<string, unknown>) => string;

let cachedSanitizeFn: SanitizeFn | null = null;
let sanitizerWarningShown = false;

const reportSanitizerIssue = () => {
  if (sanitizerWarningShown || process.env.NODE_ENV === "production") {
    return;
  }

  sanitizerWarningShown = true;
  // Keep one signal in dev while avoiding repeated log noise.
  console.error("[sanitizeHtml] DOMPurify runtime unavailable; returning raw HTML");
};

const getSanitizeFn = (): SanitizeFn | null => {
  if (cachedSanitizeFn) {
    return cachedSanitizeFn;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const moduleLike: any = createDOMPurify;
  const candidates = [moduleLike, moduleLike?.default];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate.sanitize === "function") {
      cachedSanitizeFn = candidate.sanitize.bind(candidate);
      return cachedSanitizeFn;
    }

    if (typeof candidate === "function") {
      try {
        const instance = candidate(window);
        if (instance && typeof instance.sanitize === "function") {
          cachedSanitizeFn = instance.sanitize.bind(instance);
          return cachedSanitizeFn;
        }
      } catch {
        // Ignore and continue fallback candidates.
      }
    }
  }

  return null;
};

export const sanitizeForStorage = (html: string): string => {
  return sanitizeHtml(html);
};

export const sanitizeForDisplay = (html: string): string => {
  return sanitizeHtml(html);
};

export default sanitizeHtml;
