// Utility functions for authentication
import { getApiBase } from "./apiBase";

export const clearAuthData = () => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-session')
    localStorage.removeItem('better-auth.session_token')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Clear cookies by setting them to expire
    document.cookie = 'better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

export const checkAuthStatus = async () => {
  try {
    const response = await fetch(`${getApiBase()}/api/auth/get-session`, {
      credentials: "include",
      cache: "no-store",
    })
    
    if (response.ok) {
      const sessionData = await response.json()
      return !!sessionData?.user
    }
    return false
  } catch (error) {
    console.error('Auth check failed:', error)
    return false
  }
}
