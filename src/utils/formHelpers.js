/**
 * Creates a generic input change handler for form state
 * @param {Function} setFormData - State setter function
 * @param {string} field - Field name to update
 * @returns {Function} - Event handler function
 */
export const createInputHandler = (setFormData, field) => (e) => {
  setFormData(prev => ({
    ...prev,
    [field]: e.target.value
  }))
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }
  }
  
  return { isValid: true, message: 'Password is strong' }
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
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${field} is required`
    } else if (rule.email && !isValidEmail(value)) {
      errors[field] = 'Please enter a valid email address'
    } else if (rule.password && !validatePassword(value).isValid) {
      errors[field] = validatePassword(value).message
    }
  })
  
  return errors
}