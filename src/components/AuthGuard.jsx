"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function AuthGuard({ children, redirectTo = '/login' }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while session is loading
    if (isPending) return

    // If no session exists, redirect to login
    if (!session?.user) {
      router.push(redirectTo)
      return
    }
  }, [session, isPending, router, redirectTo])

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!session?.user) {
    return null
  }

  // Render children if authenticated
  return children
}