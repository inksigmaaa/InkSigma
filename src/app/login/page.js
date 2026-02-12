"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import PasswordField from "@/components/auth/PasswordField"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
import { APP_CONFIG } from "@/constants/app"
import { signIn } from "@/lib/auth-client"
import { getApiBase } from "@/utils/apiBase"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showUnregistered, setShowUnregistered] = useState(false)

  const getOrigin = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return "http://localhost:3000"
  }

  const apiBase = getApiBase()

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError("")
    setShowUnregistered(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setShowUnregistered(false)

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (result.error) {
        const errorMessage = result.error.message || "Oops! Credentials do not match"

        // Check if it's a "no password account" error
        if (errorMessage.toLowerCase().includes("no password account")) {
          setError("This account was created with Google. Please use 'Login With Google' button below.")
        } else if (errorMessage.toLowerCase().includes("email not verified")) {
          setError("Please verify your email before logging in. Check your inbox for the verification link.")
          setShowResendVerification(true)
        } else if (errorMessage.toLowerCase().includes("invalid email or password") || errorMessage.toLowerCase().includes("invalid credentials")) {
          // Check if user exists to decide whether to show unregistered alert
          try {
            const checkRes = await fetch(`${apiBase}/api/custom/check-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email })
            })

            if (checkRes.ok) {
              const checkData = await checkRes.json()
              if (!checkData.exists) {
                setShowUnregistered(true)
                setError("") // Don't show generic error for unregistered users
              } else {
                setShowUnregistered(false)
                setError("Oops! Credentials do not match")
              }
            } else {
              // Fallback if check fails
              setError("Oops! Credentials do not match")
            }
          } catch (err) {
            console.error("Error checking user existence:", err)
            // Fallback
            setError("Oops! Credentials do not match")
          }
        } else {
          setError(errorMessage)
          if (errorMessage.toLowerCase().includes("user not found")) {
            setShowUnregistered(true)
          }
        }
        return
      }

      // If there's a specific redirect (like invitation), go there directly
      if (redirectTo !== "/") {
        // Special case: invited member flow.
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

      // Check if user has any publications (owned or joined) (only for default redirect)
      try {
        const pubsRes = await fetch(`${apiBase}/api/members/user/publications`, {
          credentials: "include",
        })

        if (pubsRes.ok) {
          const data = await pubsRes.json().catch(() => null)
          const publications = Array.isArray(data) ? data : (data?.publications || [])
          const hasAny = Array.isArray(publications) && publications.length > 0
          if (!hasAny) {
            router.push('/create-publication')
            return
          }
        }
      } catch (err) {
        console.error("Error checking publication:", err)
      }

      // User has publication or check failed, go to dashboard
      router.push(redirectTo)
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred"

      // Provide user-friendly error messages
      if (errorMessage.toLowerCase().includes("no password account")) {
        setError("This account was created with Google. Please use 'Login With Google' button below.")
      } else if (errorMessage.toLowerCase().includes("email not verified")) {
        setError("Please verify your email before logging in. Check your inbox for the verification link.")
        setShowResendVerification(true)
      } else {
        setError(errorMessage)
        setShowUnregistered(true)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      // Preserve redirect parameter in callback URL
      const origin = getOrigin()
      const callbackURL = redirectTo !== "/"
        ? `${origin}/auth-callback?redirect=${encodeURIComponent(redirectTo)}`
        : `${origin}/auth-callback`

      await signIn.social({
        provider: "google",
        callbackURL,
        prompt: "select_account",
      })
    } catch (err) {
      setError("Failed to login with Google")
      console.error(err)
    }
  }

  const handleMagicLink = () => {
    router.push('/magic-link')
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendSuccess(false)

    try {
      const response = await fetch(`${apiBase}/api/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: formData.email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to resend verification email")
      }

      setResendSuccess(true)
      setError("")
      setShowResendVerification(false)
    } catch (err) {
      setError(err.message || "Failed to resend verification email")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <AuthLayout title="Login here!">
        {resendSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Verification email sent! Please check your inbox (and spam folder).
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-[6px] md:mb-[8px]">
          <div className="w-full md:w-[258.5px] h-auto md:h-[55px] gap-[12px] opacity-100 rotate-0 mb-4 md:mb-6">
            <Label htmlFor="email" className="w-auto md:w-[37px] h-auto md:h-[16px] font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#2E2E2E] opacity-100 rotate-0">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your Email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full text-sm placeholder:text-[#C8C8C8]"
              style={{
                boxShadow: '0 0 0 30px white inset',
                WebkitBoxShadow: '0 0 0 30px white inset',
              }}
              required
            />
          </div>

          <div className="mb-2 md:mb-4 ">
            <PasswordField
              id="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange('password')}

            />
          </div>

          <div className="text-right mb-[12px] md:mb-[16px]">
            <Link
              href="/forgot-password"
              className="text-xs md:text-sm text-[#A4A4A4] hover:text-gray-700 transition-colors"
            >
              Forgot Password
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-[259px] h-[32px] opacity-100 rotate-0 gap-[10px] rounded-[4px] px-4 md:px-6 bg-[#080808] text-white hover:bg-gray-800 disabled:opacity-50 mb-2 md:mb-2 border-0 flex items-center justify-center mx-auto"
          >
            <span className="w-full text-center h-[18px] opacity-100 rotate-0 font-semibold text-[14px] max-md:text-[12px] leading-[150%] tracking-[0%] text-[#EDEDED]">
              {loading ? "Logging in..." : "Login"}
            </span>
          </Button>

          {error && (
            <div className="bg-[#F3EEFF] text-[#7A37AE] font-normal text-[12px] leading-[150%] tracking-[0%] px-4 py-3 rounded mb-4 text-left flex flex-col items-start gap-1">
              <span>{error}</span>
            </div>
          )}

          {showUnregistered ? (
            <div className="w-full md:w-[259px] h-[60px] bg-[#F3EEFF] rounded-[4px] px-[16px] py-[12px] flex items-center justify-center mt-6 mx-auto text-center">
              <p className="font-normal text-[12px] leading-[150%] tracking-[0%] text-[#7A37AE]">
                Looks like you haven't registered with us yet. <Link href="/signup" className="font-semibold underline decoration-solid decoration-[#7A37AE] hover:text-[#5e2a86]">Sign Up Now.</Link>
              </p>
            </div>
          ) : !showResendVerification ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleMagicLink}
              className="w-full md:w-[259px] h-[28px] md:h-[32px] opacity-100 rotate-0 gap-[4px] rounded-[4px] pt-[6px] md:pt-[8px] pr-[20px] md:pr-[109px] pb-[6px] md:pb-[8px] pl-[20px] md:pl-[109px] border bg-[#F4F4F4] border-[#ECECEC] text-black hover:bg-gray-50 text-xs md:text-sm flex items-center justify-center mt-6"
            >
              <span className="h-[18px]">Login with Magic link</span>
            </Button>
          ) : null}
        </form>

        <div className="text-center mt-6 flex items-center justify-center gap-1 whitespace-nowrap">
          <span className="w-[116px] h-[21px] opacity-100 rotate-0 font-medium text-[14px] leading-[150%] tracking-[0%] text-[#2E2E2E] whitespace-nowrap">
            New to InkSigma?
          </span>
          <Link
            href={redirectTo !== "/" ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
            className="w-[122px] h-[16px] opacity-100 rotate-0 font-medium text-[14px] leading-[100%] tracking-[0%] underline decoration-solid decoration-0 text-[#4B4B4B] hover:text-gray-600 transition-colors whitespace-nowrap"
          >
            Create an Account
          </Link>
        </div>

        <div className="text-center text-gray-400 mt-3 mb-[6px] md:mb-[8px] text-xs md:text-sm">or</div>

        <div className="mt-6 md:mt-5">
          <GoogleAuthButton
            text="Login With Google"
            onClick={handleGoogleLogin}
          />
        </div>

        {/* Go Back to website - positioned with proper spacing */}
        <div className="w-auto md:w-[260px] h-[16px] md:h-[24px] opacity-100 rotate-0 mt-6 md:mt-8 mb-2 mx-auto flex items-center justify-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-gray-500 transition-colors mt-6"
          >
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969]">Go Back to website</span>
          </Link>
        </div>
      </AuthLayout>

      {/* Copyright - positioned at bottom with 32px spacing */}
      <div className="mt-auto pb-4 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
        <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap" style={{ fontFamily: 'Inter' }}>
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
