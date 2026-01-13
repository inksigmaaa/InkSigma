/**
 * Format a date/time to a human-readable "time ago" string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time string
 */
export function formatTimeAgo(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Just now (< 1 minute)
    if (diffInSeconds < 60) {
        return "Just now";
    }
    
    // 1 min ago - 59 mins ago
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    // 1 hour ago - 24 hours ago
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    // Yesterday
    if (diffInDays === 1) {
        return "Yesterday";
    }
    
    // 2 days ago - 6 days ago
    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }
    
    // Last week (7-29 days)
    if (diffInDays < 30) {
        return "Last week";
    }
    
    // Last month (30+ days)
    return "Last month";
}
