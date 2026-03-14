export const DEFAULT_DRAFT_TITLE = "[Untitled]";
export const LEGACY_DRAFT_TITLE = "untitle";

export const isMissingRealTitle = (title) => {
  const normalized =
    typeof title === "string" ? title.trim().toLowerCase() : "";

  return (
    !normalized ||
    normalized === DEFAULT_DRAFT_TITLE.toLowerCase() ||
    normalized === LEGACY_DRAFT_TITLE
  );
};

export const hasMeaningfulDescription = (description) => {
  return typeof description === "string" && description.trim().length > 0;
};

export const hasMeaningfulContent = (content) => {
  if (typeof content !== "string") {
    return false;
  }

  const normalized = content
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0;
};

export const isArticlePublishable = ({
  title,
  description,
  content,
  isPublishable,
}) => {
  if (typeof isPublishable === "boolean") {
    return isPublishable;
  }

  return (
    !isMissingRealTitle(title) &&
    hasMeaningfulDescription(description) &&
    hasMeaningfulContent(content)
  );
};
