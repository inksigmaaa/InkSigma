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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (result.error) {
        const errorMessage = result.error.message || "Invalid email or password"
        
        // Check if it's a "no password account" error
        if (errorMessage.toLowerCase().includes("no password account")) {
          setError("This account was created with Google. Please use 'Login With Google' button below.")
        } else if (errorMessage.toLowerCase().includes("email not verified")) {
          setError("Please verify your email before logging in. Check your inbox for the verification link.")
          setShowResendVerification(true)
        } else {
          setError(errorMessage)
        }
        return
      }

      // If there's a specific redirect (like invitation), go there directly
      if (redirectTo !== "/dashboard") {
        router.push(redirectTo)
        return
      }

      // Check if user has a publication (only for dashboard redirect)
      try {
        const sessionRes = await fetch("http://localhost:5000/api/auth/get-session", {
          credentials: "include",
        })
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          const userId = sessionData.user.id
          
          const pubRes = await fetch(`http://localhost:5000/api/publications/user/${userId}`, {
            credentials: "include",
          })
          
          if (pubRes.status === 404) {
            // No publication, redirect to create one
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
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      // Preserve redirect parameter in callback URL
      const callbackURL = redirectTo !== "/dashboard" 
        ? `http://localhost:3000/auth-callback?redirect=${encodeURIComponent(redirectTo)}`
        : `http://localhost:3000/auth-callback`
      
      await signIn.social({
        provider: "google",
        callbackURL,
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
      const response = await fetch("http://localhost:5000/api/resend-verification", {
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
    <AuthLayout title="Login here!">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {showResendVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="mt-2 text-sm underline hover:text-red-800 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Verification email sent! Please check your inbox (and spam folder).
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange('password')}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleMagicLink}
          className="w-full bg-white text-black border-gray-300 hover:bg-gray-50 rounded-md py-3"
        >
          Login with Magic link
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        New to {APP_CONFIG.name}?{" "}
        <Link
          href="/signup"
          className="text-gray-900 underline hover:text-gray-700 transition-colors"
        >
          Create a Account
        </Link>
      </div>

      <div className="text-center text-gray-400">or</div>

      <GoogleAuthButton
        text="Login With Google"
        onClick={handleGoogleLogin}
      />
    </AuthLayout>
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
