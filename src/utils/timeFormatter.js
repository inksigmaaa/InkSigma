/**
 * Format a date/time to a human-readable "time ago" string
 * @param {Date|string} date - The date to format (expects ISO 8601 string like "2026-01-13T12:00:00.000Z")
 * @returns {string} Formatted time string
 */
export function formatTimeAgo(date) {
    if (!date) return "Unknown";
    
    // Parse the date - expecting ISO 8601 format from backend
    const past = new Date(date);
    
    // Validate the parsed date
    if (isNaN(past.getTime())) {
        console.error("Invalid date format:", date);
        return "Invalid date";
    }
    
    const now = new Date();
    const diffMs = now - past;
    
    // Debug: log if we detect a future timestamp (indicates timezone/clock issue)
    if (diffMs < 0) {
        console.warn("Future timestamp detected:", {
            date,
            parsed: past.toISOString(),
            now: now.toISOString(),
            diffMs
        });
        return "Just now";
    }
    
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
