"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { LOGOS } from "@/constants/app"

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
      <div className="bg-white min-h-screen overflow-hidden px-4 relative">
        {/* Logo - positioned 193px above center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230]">
          <Image
            src={LOGOS.auth}
            alt="InkSigma Logo"
            width={127}
            height={41.843929290771484}
            className="mx-auto w-[100px] md:w-[127px] h-auto"
          />
        </div>

        {/* Body Content - centered on page */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-[258.5px] flex flex-col items-center">
            <h1 className="font-bold text-[14px] md:text-[16px] leading-[28px] tracking-[0%] text-[#2E2E2E] mb-8">
              Check Your Email
            </h1>
            
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 text-sm md:text-base">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Please check your inbox and click the link to reset your password.
                </p>
              </div>
              <div className="text-center pt-4">
                <div className="flex items-center justify-center gap-2">
                  <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <Link
                    href="/login"
                    className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969] hover:text-gray-500 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - positioned 32px from bottom */}
        <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
          <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap" style={{ fontFamily: 'Inter' }}>
            Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen overflow-hidden px-4 relative">
      {/* Logo - positioned 193px above center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230]">
        <Image
          src={LOGOS.auth}
          alt="InkSigma Logo"
          width={127}
          height={41.843929290771484}
          className="mx-auto w-[100px] md:w-[127px] h-auto"
        />
      </div>

      {/* Body Content - centered on page */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-[258.5px] flex flex-col items-center">
          <h1 className="font-bold text-[14px] md:text-[16px] leading-[28px] tracking-[0%] text-[#2E2E2E] mb-8">
            Forgot Password?
          </h1>
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#2E2E2E]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full text-sm  placeholder:text-[#C8C8C8]"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full md:w-[259px] h-[32px] opacity-100 rotate-0 gap-[10px] rounded-[4px] pt-[8px] pr-[20px] md:pr-[109px] pb-[8px] pl-[20px] md:pl-[109px] bg-[#080808] hover:bg-gray-800 disabled:opacity-50 mt-8 border-0 flex items-center justify-center mx-auto"
              disabled={loading}
            >
              <span className="font-medium text-[12px] md:text-[14px] leading-[150%] tracking-[0%] text-[#EDEDED]" style={{ fontFamily: 'Public Sans' }}>
                {loading ? "Sending..." : "Send to Mail"}
              </span>
            </Button>
          </form>

          <div className="text-center pt-6">
            <div className="flex items-center justify-center gap-2">
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <Link
                href="/login"
                className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969] hover:text-gray-500 transition-colors"
              >
              Go Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright - positioned 32px from bottom */}
      <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
        <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap" style={{ fontFamily: 'Inter' }}>
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
        </p>
      </div>
    </div>
  )
}
