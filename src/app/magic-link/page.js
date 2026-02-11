"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LOGOS } from "@/constants/app"

function MagicLinkPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Add your magic link API call here
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to send magic link")
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || "Failed to send magic link")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white min-h-screen overflow-hidden px-4 relative">
        {/* Logo - positioned 248px above the centered body */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2" style={{ marginTop: '-248px' }}>
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
          <div className="text-center space-y-4">
            <h2 className="font-bold text-[14px] md:text-[16px] leading-[28px] tracking-[0%] text-[#2E2E2E]">
              Check Your Email
            </h2>
            <p className="text-gray-700 text-sm md:text-base">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Click the link in your email to sign in.
            </p>
            <div className="flex items-center justify-center gap-2 mt-8">
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round" />
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

        {/* Copyright - positioned 36px from bottom */}
        <div className="absolute bottom-[36px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
          <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap" style={{ fontFamily: 'Inter' }}>
            Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen overflow-hidden px-4 relative">
      {/* Logo - positioned 248px above the centered body */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2" style={{ marginTop: '-248px' }}>
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
        <div className="w-full max-w-[259px] flex flex-col items-center">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 w-full text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            {/* Email Field */}
            <div className="w-full md:w-[258.5px] h-auto md:h-[55px] gap-[12px] opacity-100 rotate-0 mb-6">
              <Label htmlFor="email" className="w-auto md:w-[37px] h-auto md:h-[16px] font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#2E2E2E] opacity-100 rotate-0 block mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full text-sm md:text-base placeholder:w-[107px] placeholder:h-[21px] placeholder:opacity-100 placeholder:rotate-0 placeholder:font-normal placeholder:text-[12px] md:placeholder:text-[14px] placeholder:leading-[150%] placeholder:tracking-[0%] placeholder:text-[#C8C8C8]"
                style={{
                  boxShadow: '0 0 0 30px white inset',
                  WebkitBoxShadow: '0 0 0 30px white inset',
                }}
                required
              />
            </div>

            {/* Send to Mail Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-[259px] h-[32px] opacity-100 rotate-0 gap-[10px] rounded-[4px] pt-[8px] pr-[20px] md:pr-[109px] pb-[8px] pl-[20px] md:pl-[109px] bg-[#080808] hover:bg-gray-800 disabled:opacity-50 mt-[24px] md:mt-[32px] mb-6 md:mb-8 border-0 flex items-center justify-center"
            >
              {loading ? (
                <span className="font-medium text-[12px] md:text-[14px] leading-[150%] tracking-[0%] text-[#EDEDED]" style={{ fontFamily: 'Public Sans' }}>
                  Sending...
                </span>
              ) : (
                <>
                  <span className="hidden md:inline font-medium text-[12px] md:text-[14px] leading-[150%] tracking-[0%] text-[#EDEDED]" style={{ fontFamily: 'Public Sans' }}>
                    Send to Mail
                  </span>
                  <div className="md:hidden flex items-center gap-2">
                    <span className="font-medium text-[12px] leading-[150%] tracking-[0%] text-[#EDEDED]" style={{ fontFamily: 'Public Sans' }}>
                      Mail sent
                    </span>
                    <svg width="14" height="13" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-100">
                      <path d="M14.5996 0.629872L4.97461 9.27636V13.5996L7.59961 11.0057M0.599609 6.25009L14.5996 0.599609L12.1496 13.1673L0.599609 6.25009Z" stroke="#EDEDED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </>
              )}
            </Button>

            {/* Go Back Link */}
            <div className="flex items-center justify-center gap-2">
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <Link
                href="/login"
                className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969] hover:text-gray-500 transition-colors"
              >
                Go Back
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Copyright - positioned 36px from bottom */}
      <div className="absolute bottom-[36px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
        <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap" style={{ fontFamily: 'Inter' }}>
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
        </p>
      </div>
    </div>
  )
}

export default MagicLinkPage