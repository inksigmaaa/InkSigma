import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services'

/**
 * Custom hook for authentication
 * @returns {Object} - Auth state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Load current user on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      } catch (err) {
        console.error('Failed to load user:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * Login user
   */
  const login = useCallback(async (credentials) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await authService.login(credentials)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Register user
   */
  const register = useCallback(async (userData) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await authService.register(userData)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await authService.logout()
      setUser(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email) => {
    setLoading(true)
    setError(null)
    
    try {
      await authService.forgotPassword(email)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true)
    setError(null)
    
    try {
      await authService.resetPassword(token, newPassword)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  }
}
