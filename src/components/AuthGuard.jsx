"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function AuthGuard({ children, redirectTo = '/login' }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const validateSession = async () => {
      // Don't validate while session is loading
      if (isPending) return

      // If no session exists, redirect to login
      if (!session?.user) {
        setIsAuthenticated(false)
        setIsValidating(false)
        router.push(redirectTo)
        return
      }

      // Validate session with server
      try {
        const response = await fetch("http://localhost:5000/api/auth/get-session", {
          credentials: "include",
          cache: "no-store",
        })
        
        if (response.ok) {
          const sessionData = await response.json()
          if (sessionData?.user) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
            router.push(redirectTo)
          }
        } else {
          setIsAuthenticated(false)
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Session validation error:', error)
        setIsAuthenticated(false)
        router.push(redirectTo)
      } finally {
        setIsValidating(false)
      }
    }

    validateSession()
  }, [session, isPending, router, redirectTo])

  // Show loading while checking authentication
  if (isPending || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Render children if authenticated
  return children
}