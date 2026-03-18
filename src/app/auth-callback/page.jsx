"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getApiBase } from "@/utils/apiBase"
import { buildLoginRedirectPath, waitForServerSession } from "@/utils/auth"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")

  useEffect(() => {
    const controller = new AbortController()

    const checkPublicationAndRedirect = async () => {
      try {
        const apiBase = getApiBase()
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

        const fetchWithRetry = async (url, options = {}, maxAttempts = 3) => {
          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            if (controller.signal.aborted) {
              return null
            }

            try {
              const response = await fetch(url, options)
              if (response.ok) return response
              if (response.status !== 401 || attempt === maxAttempts) {
                return response
              }
            } catch (error) {
              if (error?.name === "AbortError") {
                throw error
              }

              if (attempt === maxAttempts) throw error
            }

            if (controller.signal.aborted) {
              return null
            }

            await delay(250 * attempt)
          }
          return null
        }

        const activeSession = await waitForServerSession({
          attempts: 5,
          delayMs: 250,
          signal: controller.signal,
        })

        if (!activeSession?.user?.id) {
          router.replace(buildLoginRedirectPath(redirectTo || "/"))
          return
        }

        // If there's a specific redirect (like invitation), handle it first.
        if (redirectTo) {
          // Special case: invited member flow.
          // If this is a brand-new InkSigma user (no owned publication yet),
          // take them through create-publication first, then return to invite acceptance.
          if (redirectTo.startsWith("/invite/")) {
            try {
              const ownedRes = await fetch(`${apiBase}/api/publications/check`, {
                credentials: "include",
                signal: controller.signal,
              })
              if (ownedRes.ok) {
                const data = await ownedRes.json().catch(() => null)
                const hasOwned = Boolean(data?.hasPublication)
                if (!hasOwned) {
                  router.replace(
                    `/create-publication?redirect=${encodeURIComponent(redirectTo)}`,
                  )
                  return
                }
              }
            } catch (err) {
              console.error("Error checking owned publication:", err)
            }
          }

          router.replace(redirectTo)
          return
        }

        const pubsRes = await fetchWithRetry(`${apiBase}/api/members/user/publications`, {
          credentials: "include",
          signal: controller.signal,
        })

        if (!pubsRes?.ok) {
          router.replace("/")
          return
        }

        const data = await pubsRes.json().catch(() => null)
        const publications = Array.isArray(data) ? data : (data?.publications || [])
        const hasAny = Array.isArray(publications) && publications.length > 0

        router.replace(hasAny ? '/' : '/create-publication')
      } catch (err) {
        if (err?.name === "AbortError") {
          return
        }

        console.error("Error checking publication:", err)
        router.replace('/')
      }
    }

    checkPublicationAndRedirect()

    return () => {
      controller.abort()
    }
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
