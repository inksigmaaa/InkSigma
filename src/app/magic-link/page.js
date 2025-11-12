"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import { signIn } from "@/lib/auth-client"

export default function MagicLinkPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || "Failed to send magic link")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Enter you mail Id here and receive login invite through mail"
      titleClassName="text-l font-bold text-purple-600 bg-purple-100 p-6 rounded-lg"
    >
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Magic link sent! Check your email to login.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 text-lg font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
            disabled={loading || success}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || success}
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3 disabled:opacity-50"
        >
          {loading ? "Sending..." : success ? "Magic Link Sent!" : "Send to Mail"}
        </Button>
      </form>
      <div className="text-center mt-6">
        <Link
          href="/login"
          className="text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-2"
        >
          <span>←</span> Back to Login
        </Link>
      </div>
    </AuthLayout>
  )
}
