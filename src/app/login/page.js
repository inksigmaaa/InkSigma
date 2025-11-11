"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import PasswordField from "@/components/auth/PasswordField"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
import { APP_CONFIG } from "@/constants/app"
import { signIn } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
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
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (result.error) {
        setError(result.error.message || "Invalid email or password")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("Failed to login with Google")
      console.error(err)
    }
  }

  const handleMagicLink = () => {
    router.push('/magic-link')
  }

  return (
    <AuthLayout title="Login here!">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
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
      <div className="text-center text-gray-400">
        or
      </div>
      <GoogleAuthButton
        text="Login With Google"
        onClick={handleGoogleLogin}
      />
    </AuthLayout>
  )
}