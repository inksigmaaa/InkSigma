const FONT_OPTIONS = [
  "Arial",
  "Arial Black",
  "Brush Script MT",
  "Comic Sans MS",
  "Courier New",
  "Garamond",
  "Georgia",
  "Helvetica",
  "Impact",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Palatino Linotype",
  "Roboto",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

export const FONT_MAP = new Map(FONT_OPTIONS.map((font, index) => [font, index]));

const API_ORIGINS = [
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:5000",
]
  .filter(Boolean)
  .map((url) => String(url).replace(/\/$/, ""));

export const createApiUrl = (relativePath) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
};

export const normalizeImageUrl = (url, forStorage = false) => {
  if (!url) return url;

  if (forStorage) {
    // Cloudinary URLs are already absolute and should be stored as-is
    if (url.includes("res.cloudinary.com")) return url;

    for (const origin of API_ORIGINS) {
      if (url.startsWith(origin)) {
        const path = url.substring(origin.length) || "/";
        return path.startsWith("/") ? path : `/${path}`;
      }
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.host.endsWith(":5000")) {
        return `${parsedUrl.pathname}${parsedUrl.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return createApiUrl(url);
};

export const processEditorContent = (content, normalizeFn) => {
  if (!content) return content;
  return content.replace(/src="([^"]*)"/g, (match, src) => {
    if (!src) return match;
    const normalized = normalizeFn(src);
    return `src="${normalized}"`;
  });
};

export default FONT_OPTIONS;
