import { useState, useCallback } from 'react'
import { validateForm, hasErrors, createMultiFieldHandler } from '@/utils/formHelpers'

/**
 * Custom hook for form management
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} - Form state and handlers
 */
export const useForm = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Handle input change
   */
  const handleChange = useCallback(createMultiFieldHandler(setFormData), [])

  /**
   * Handle input blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate single field on blur
    if (validationRules[name]) {
      const fieldErrors = validateForm({ [name]: formData[name] }, { [name]: validationRules[name] })
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name] || null
      }))
    }
  }, [formData, validationRules])

  /**
   * Validate entire form
   */
  const validate = useCallback(() => {
    const validationErrors = validateForm(formData, validationRules)
    setErrors(validationErrors)
    return !hasErrors(validationErrors)
  }, [formData, validationRules])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validate form
    const isValid = validate()
    
    if (!isValid) {
      return
    }

    // Submit form
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [formData, validate, onSubmit, validationRules])

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setFormData(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  /**
   * Set form values programmatically
   */
  const setValues = useCallback((values) => {
    setFormData(prev => ({ ...prev, ...values }))
  }, [])

  /**
   * Set a single field value
   */
  const setValue = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  /**
   * Set form errors programmatically
   */
  const setFormErrors = useCallback((newErrors) => {
    setErrors(prev => ({ ...prev, ...newErrors }))
  }, [])

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setValue,
    setFormErrors,
    validate,
    isValid: !hasErrors(errors)
  }
}
