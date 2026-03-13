import DOMPurify from "dompurify";

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

  const config = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    ADD_TAGS: ["iframe"],
  };

  return DOMPurify.sanitize(html, config);
};

export const sanitizeForStorage = (html: string): string => {
  return sanitizeHtml(html);
};

export const sanitizeForDisplay = (html: string): string => {
  return sanitizeHtml(html);
};

export default sanitizeHtml;
