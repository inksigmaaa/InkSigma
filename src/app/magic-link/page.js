"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"

export default function MagicLinkPage() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Magic link sent to:', email)
  }

  return (
    <AuthLayout 
      title="Enter you mail Id here and receive login invite through mail"
      titleClassName="text-l font-bold text-purple-600 bg-purple-100 p-6 rounded-lg"
    >
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
          />
        </div>
        <Button 
          type="submit"
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
        >
          Send to Mail
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
