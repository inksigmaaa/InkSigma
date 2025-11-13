import { VALIDATION_RULES } from '@/constants'

/**
 * Creates a generic input change handler for form state
 * @param {Function} setFormData - State setter function
 * @param {string} field - Field name to update
 * @returns {Function} - Event handler function
 */
export const createInputHandler = (setFormData, field) => (e) => {
  const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
  setFormData(prev => ({
    ...prev,
    [field]: value
  }))
}

/**
 * Creates a handler for multiple fields at once
 * @param {Function} setFormData - State setter function
 * @returns {Function} - Event handler function
 */
export const createMultiFieldHandler = (setFormData) => (e) => {
  const { name, value, type, checked } = e.target
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }))
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false
  return VALIDATION_RULES.EMAIL_REGEX.test(email.trim())
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long` 
    }
  }
  
  if (!VALIDATION_RULES.PASSWORD_REGEX.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }
  }
  
  return { isValid: true, message: 'Password is strong' }
}

/**
 * Validates a single field based on rules
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {Object} rule - Validation rule
 * @returns {string|null} - Error message or null
 */
const validateField = (field, value, rule) => {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return rule.message || `${field} is required`
  }
  
  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }
  
  // Email validation
  if (rule.email && !isValidEmail(value)) {
    return rule.message || 'Please enter a valid email address'
  }
  
  // Password validation
  if (rule.password) {
    const result = validatePassword(value)
    if (!result.isValid) {
      return rule.message || result.message
    }
  }
  
  // Min length validation
  if (rule.minLength && value.length < rule.minLength) {
    return rule.message || `${field} must be at least ${rule.minLength} characters`
  }
  
  // Max length validation
  if (rule.maxLength && value.length > rule.maxLength) {
    return rule.message || `${field} must not exceed ${rule.maxLength} characters`
  }
  
  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message || `${field} format is invalid`
  }
  
  // Custom validation function
  if (rule.custom && typeof rule.custom === 'function') {
    const customResult = rule.custom(value)
    if (customResult !== true) {
      return typeof customResult === 'string' ? customResult : rule.message || `${field} is invalid`
    }
  }
  
  return null
}

/**
 * Generic form validation
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation errors
 */
export const validateForm = (formData, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = formData[field]
    const rule = rules[field]
    const error = validateField(field, value, rule)
    
    if (error) {
      errors[field] = error
    }
  })
  
  return errors
}

/**
 * Checks if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} - Whether form has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0
}

/**
 * Sanitizes form input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/[<>]/g, '')
}