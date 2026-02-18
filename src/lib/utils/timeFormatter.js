export function formatTimeAgo(date) {
    if (!date) return "Unknown";
    const past = new Date(date);
    if (isNaN(past.getTime())) return "Invalid date";
    const now = new Date();
    const diffMs = now - past;
    if (diffMs < 0) return "Just now";
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return diffMinutes === 1 ? "1 min ago" : `${diffMinutes} mins ago`;
    if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 6) return `${diffDays} days ago`;
    return "Last week";
}
