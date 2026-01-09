"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function AuthGuard({ children, redirectTo = '/login' }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Handle redirects in a separate useEffect to avoid React warnings
  useEffect(() => {
    if (shouldRedirect) {
      console.log('AuthGuard: Redirecting to login')
      router.push(redirectTo)
      setShouldRedirect(false)
    }
  }, [shouldRedirect, router, redirectTo])

  useEffect(() => {
    const validateSession = async () => {
      console.log('AuthGuard: Starting validation', { session, isPending })
      
      // Don't validate while session is loading
      if (isPending) {
        console.log('AuthGuard: Session is pending, waiting...')
        return
      }

      // If no session exists, redirect to login
      if (!session?.user) {
        console.log('AuthGuard: No session found, will redirect to login')
        setIsAuthenticated(false)
        setIsValidating(false)
        setShouldRedirect(true)
        return
      }

      console.log('AuthGuard: Session found, validating with server...', session.user)

      // Validate session with server
      try {
        const response = await fetch("http://localhost:5000/api/auth/get-session", {
          credentials: "include",
          cache: "no-store",
        })
        
        console.log('AuthGuard: Server response status:', response.status)
        
        if (response.ok) {
          const sessionData = await response.json()
          console.log('AuthGuard: Server session data:', sessionData)
          
          if (sessionData?.user) {
            console.log('AuthGuard: Server validation successful')
            setIsAuthenticated(true)
          } else {
            console.log('AuthGuard: Server validation failed - no user in response')
            setIsAuthenticated(false)
            setShouldRedirect(true)
          }
        } else {
          console.log('AuthGuard: Server validation failed - response not ok')
          setIsAuthenticated(false)
          setShouldRedirect(true)
        }
      } catch (error) {
        console.error('AuthGuard: Session validation error:', error)
        setIsAuthenticated(false)
        setShouldRedirect(true)
      } finally {
        setIsValidating(false)
      }
    }

    validateSession()
  }, [session, isPending])

  // Show loading while checking authentication
  if (isPending || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Checking authentication...</div>
      </div>
    )
  }

  // Don't render children if not authenticated or should redirect
  if (!isAuthenticated || shouldRedirect) {
    console.log('AuthGuard: Not authenticated, not rendering children')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Redirecting to login...</div>
      </div>
    )
  }

  console.log('AuthGuard: Authenticated, rendering children')
  // Render children if authenticated
  return children
}