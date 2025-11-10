/**
 * Date utility functions
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} - Formatted date
 */
export const formatDate = (date, locale = 'en-US') => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} - Formatted date and time
 */
export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - Whether date is today
 */
export const isToday = (date) => {
  if (!date) return false
  const today = new Date()
  const d = new Date(date)
  return d.toDateString() === today.toDateString()
}

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - Whether date is in the past
 */
export const isPast = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} - Whether date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false
  return new Date(date) > new Date()
}

/**
 * Add days to date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get start of day
 * @param {Date|string} date - Date
 * @returns {Date} - Start of day
 */
export const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 * @param {Date|string} date - Date
 * @returns {Date} - End of day
 */
export const endOfDay = (date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
