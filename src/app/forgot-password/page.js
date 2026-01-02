"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Use custom endpoint
      const response = await fetch("http://localhost:5000/api/custom/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          redirectTo: "http://localhost:3000/reset-password"
        }),
        credentials: "include",
      })
      
      const data = await response.json()
      console.log("Response:", response.status, data)
      
      if (response.ok && data.success) {
        setSuccess(true)
        return
      }
      
      throw new Error(data.error || "Failed to send reset email")
    } catch (err) {
      console.error('Password reset error:', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please try again.")
      } else {
        setError(err.message || "Failed to send reset email. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Check Your Email">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Please check your inbox and click the link to reset your password.
            </p>
          </div>
          <div className="text-center pt-4">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot Password?">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send to Mail"}
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
