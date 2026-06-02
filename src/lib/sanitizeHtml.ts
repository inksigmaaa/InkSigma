import DOMPurify from "isomorphic-dompurify";

/**
 * HTML sanitizer for author-authored blog content.
 *
 * Uses `isomorphic-dompurify` so sanitization runs identically on the server
 * (SSR / React Server Components) and the client. This is important: blog
 * bodies are server-rendered via `dangerouslySetInnerHTML`, so a browser-only
 * sanitizer would emit unsanitized markup in the initial HTML response.
 *
 * Failure mode is FAIL CLOSED — if sanitization throws we return an empty
 * string, never the raw input. Defense-in-depth: the backend also sanitizes on
 * write, but this guarantees the frontend never renders untrusted markup.
 */
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

const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["target"],
  // NOTE: `iframe` and inline `style` remain allowed to preserve existing
  // published content (embeds, text alignment/color). Tightening these is
  // tracked separately as it can strip formatting from legacy posts.
  ADD_TAGS: ["iframe"],
};

// Force safe rel on links that open a new tab — prevents reverse tabnabbing
// (the opened page gaining a `window.opener` handle back to ours).
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export const sanitizeHtml = (html: string): string => {
  if (!html) return "";

  try {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
  } catch (error) {
    // Fail closed: never emit unsanitized markup, even if the sanitizer throws.
    if (process.env.NODE_ENV !== "production") {
      console.error("[sanitizeHtml] sanitization failed; returning empty string", error);
    }
    return "";
  }
};
