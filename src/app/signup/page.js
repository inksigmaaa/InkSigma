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
import { signUp, signIn } from "@/lib/auth-client"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (result.error) {
        setError(result.error.message || "Failed to sign up")
        return
      }

      router.push(redirectTo)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      })
    } catch (err) {
      setError("Failed to sign up with Google")
      console.error(err)
    }
  }

  return (
    <AuthLayout title="Welcome, Sign up here!">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
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
          label="Create Password"
          placeholder="Create your password"
          value={formData.password}
          onChange={handleInputChange('password')}
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3 disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
      <div className="text-center text-sm text-gray-600">
        Already a User?{" "}
        <Link href="/login" className="text-gray-900 underline hover:text-gray-700 transition-colors">
          Login
        </Link>
      </div>
      <div className="text-center text-gray-400">
        or
      </div>
      <GoogleAuthButton
        text="Signup With Google"
        onClick={handleGoogleSignup}
      />
    </AuthLayout>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  )
}