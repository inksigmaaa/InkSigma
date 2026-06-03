/**
 * Format a date as a relative "Posted …" string for article cards.
 *
 * Shared by ArticleContainer and PersonalArticleContainer. The optional
 * `status` argument enables the review-specific "Sent on <full date>" form;
 * callers that omit it get the plain relative form (identical to the previous
 * ArticleContainer behavior).
 */
export const getRelativeTime = (dateString, status) => {
  if (!dateString) return "";

  try {
    const postDate = new Date(dateString);

    if (isNaN(postDate.getTime())) {
      return dateString;
    }

    if (status === "review") {
      const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      return `Sent on ${postDate.toLocaleDateString("en-US", options)}`;
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) {
      return "Posted just now";
    }

    if (diffInMinutes < 60) {
      return `Posted ${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    if (diffInHours < 24) {
      return `Posted ${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
    }

    const options = { day: "numeric", month: "short", year: "numeric" };
    return `Posted ${postDate.toLocaleDateString("en-US", options)}`;
  } catch {
    return dateString;
  }
};
