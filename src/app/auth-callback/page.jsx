"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")

  useEffect(() => {
    const checkPublicationAndRedirect = async () => {
      try {
        // If there's a specific redirect (like invitation), go there directly
        if (redirectTo) {
          router.push(redirectTo)
          return
        }

        const sessionRes = await fetch("http://localhost:5000/api/auth/get-session", {
          credentials: "include",
        })
        
        if (!sessionRes.ok) {
          router.push('/login')
          return
        }
        
        const sessionData = await sessionRes.json()
        const userId = sessionData.user.id
        
        const pubRes = await fetch(`http://localhost:5000/api/publications/user/${userId}`, {
          credentials: "include",
        })
        
        if (pubRes.status === 404) {
          router.push('/create-publication')
        } else {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error("Error checking publication:", err)
        router.push('/dashboard')
      }
    }

    checkPublicationAndRedirect()
  }, [router, redirectTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}