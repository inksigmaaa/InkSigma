function tryParseAsLocalWithoutTimezone(raw) {
    if (typeof raw !== "string") return null;
    const normalized = raw.trim().replace("T", " ").replace("Z", "");
    const local = new Date(normalized);
    return Number.isNaN(local.getTime()) ? null : local;
}

export function formatTimeAgo(date, nowInput = Date.now()) {
    if (!date) return "Unknown";

    const now = new Date(nowInput);
    if (Number.isNaN(now.getTime())) return "Just now";

    let past = new Date(date);
    if (Number.isNaN(past.getTime())) return "Invalid date";

    // Some DB timestamps are timezone-naive but serialized with "Z", which can
    // shift them into the future in the client timezone. Try a local fallback.
    if (past.getTime() - now.getTime() > 60000) {
        const localFallback = tryParseAsLocalWithoutTimezone(date);
        if (localFallback && localFallback.getTime() <= now.getTime() + 60000) {
            past = localFallback;
        }
    }

    // Use absolute difference to avoid permanently showing "Just now" for
    // timezone-shifted values that still end up slightly in the future.
    const diffMs = Math.abs(now.getTime() - past.getTime());

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return diffMinutes === 1 ? "1 min ago" : `${diffMinutes} mins ago`;
    if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
}
