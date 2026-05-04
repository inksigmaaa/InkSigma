export const AI_QUICK_ACTIONS = [
  { key: "fix_grammar", label: "Fix Grammar" },
  { key: "improve_writing", label: "Improve Writing" },
];

export const AI_REWRITE_ACTIONS = [
  { key: "make_shorter", label: "Make Shorter" },
  { key: "make_longer", label: "Make Longer" },
];

export const AI_TONE_ACTIONS = [
  { key: "tone_formal", label: "Formal" },
  { key: "tone_casual", label: "Casual" },
  { key: "tone_professional", label: "Professional" },
];

export const AI_REQUEST_DEBOUNCE_MS = 500;
export const AI_MIN_RECOMMENDED_CHARS = 24;
export const AI_LARGE_SELECTION_CHARS = 2500;
export const AI_POPUP_WIDTH = 420;
export const AI_POPUP_ESTIMATED_HEIGHT = 320;
export const AI_VIEWPORT_PADDING = 12;
export const AI_POPUP_GAP = 12;

export const clampNumber = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export const decodeBasicHtmlEntities = (value) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'");

const textToJsonContent = (text) => {
  if (!text) return [];

  return text.split("\n").reduce((content, line, index) => {
    if (index > 0) {
      content.push({ type: "hardBreak" });
    }
    if (line) {
      content.push({ type: "text", text: line });
    }
    return content;
  }, []);
};

export const textToEditorContent = (text) => {
  const normalized = decodeBasicHtmlEntities(text).trim();
  if (!normalized) return [];

  if (!/\n/.test(normalized)) {
    return { type: "text", text: normalized };
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      content: textToJsonContent(paragraph),
    }));
};

export const normalizeForComparison = (text) =>
  decodeBasicHtmlEntities(text || "")
    .replace(/\s+/g, " ")
    .trim();

export const getWordDiff = (before = "", after = "") => {
  const oldWords = normalizeForComparison(before).split(/\s+/).filter(Boolean);
  const newWords = normalizeForComparison(after).split(/\s+/).filter(Boolean);
  const matrix = Array.from({ length: oldWords.length + 1 }, () =>
    Array(newWords.length + 1).fill(0),
  );

  for (let i = oldWords.length - 1; i >= 0; i -= 1) {
    for (let j = newWords.length - 1; j >= 0; j -= 1) {
      matrix[i][j] =
        oldWords[i] === newWords[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  const parts = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      parts.push({ type: "equal", text: oldWords[i] });
      i += 1;
      j += 1;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      parts.push({ type: "delete", text: oldWords[i] });
      i += 1;
    } else {
      parts.push({ type: "insert", text: newWords[j] });
      j += 1;
    }
  }

  while (i < oldWords.length) {
    parts.push({ type: "delete", text: oldWords[i] });
    i += 1;
  }

  while (j < newWords.length) {
    parts.push({ type: "insert", text: newWords[j] });
    j += 1;
  }

  return parts;
};

export const countDiffChanges = (parts) => {
  let count = 0;
  let inChange = false;

  parts.forEach((part) => {
    if (part.type === "equal") {
      inChange = false;
      return;
    }

    if (!inChange) {
      count += 1;
      inChange = true;
    }
  });

  return count;
};
