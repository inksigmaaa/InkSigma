/**
 * String utility functions
 */

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title cased string
 */
export const toTitleCase = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} - Truncated string
 */
export const truncate = (str, length, suffix = '...') => {
  if (!str || str.length <= length) return str
  return str.substring(0, length).trim() + suffix
}

/**
 * Generate slug from string
 * @param {string} str - String to slugify
 * @returns {string} - Slugified string
 */
export const slugify = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Remove HTML tags from string
 * @param {string} str - String with HTML
 * @returns {string} - Plain text
 */
export const stripHtml = (str) => {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Count words in string
 * @param {string} str - String to count
 * @returns {number} - Word count
 */
export const wordCount = (str) => {
  if (!str) return 0
  return str.trim().split(/\s+/).length
}

/**
 * Estimate reading time in minutes
 * @param {string} text - Text to analyze
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} - Estimated minutes
 */
export const estimateReadingTime = (text, wordsPerMinute = 200) => {
  const words = wordCount(text)
  return Math.ceil(words / wordsPerMinute)
}
