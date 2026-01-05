"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import PasswordField from "@/components/auth/PasswordField"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/custom/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.password
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
    } catch (err) {
      console.error("Reset password error:", err)
      setError(err.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <AuthLayout title="Invalid Link">
        <div className="space-y-6 text-center">
          <p className="text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout title="Password Reset">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">
              Your password has been reset successfully!
            </p>
            <p className="text-sm text-gray-500">
              You can now login with your new password.
            </p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
          >
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset Password">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordField
          id="password"
          label="New Password"
          placeholder="Enter your New password"
          value={formData.password}
          onChange={handleInputChange('password')}
          minLength={8}
        />

        <PasswordField
          id="confirmPassword"
          label="Reconfirm Password"
          placeholder="Re-enter your password."
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          minLength={8}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Change Password"}
        </Button>
      </form>

      <div className="text-center pt-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
