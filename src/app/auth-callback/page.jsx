"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getApiBase } from "@/utils/apiBase"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")

  useEffect(() => {
    const checkPublicationAndRedirect = async () => {
      try {
        const apiBase = getApiBase()

        // If there's a specific redirect (like invitation), handle it first.
        if (redirectTo) {
          // Special case: invited member flow.
          // If this is a brand-new InkSigma user (no owned publication yet),
          // take them through create-publication first, then return to invite acceptance.
          if (redirectTo.startsWith("/invite/")) {
            try {
              const ownedRes = await fetch(`${apiBase}/api/publications/check`, {
                credentials: "include",
              })
              if (ownedRes.ok) {
                const data = await ownedRes.json().catch(() => null)
                const hasOwned = Boolean(data?.hasPublication)
                if (!hasOwned) {
                  router.push(
                    `/create-publication?redirect=${encodeURIComponent(redirectTo)}`,
                  )
                  return
                }
              }
            } catch (err) {
              console.error("Error checking owned publication:", err)
            }
          }

          router.push(redirectTo)
          return
        }

        const pubsRes = await fetch(`${apiBase}/api/members/user/publications`, {
          credentials: "include",
        })
        
        if (!pubsRes.ok) {
          router.push('/login')
          return
        }

        const data = await pubsRes.json().catch(() => null)
        const publications = Array.isArray(data) ? data : (data?.publications || [])
        const hasAny = Array.isArray(publications) && publications.length > 0

        router.push(hasAny ? '/' : '/create-publication')
      } catch (err) {
        console.error("Error checking publication:", err)
        router.push('/')
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
