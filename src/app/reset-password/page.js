"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import PasswordField from "@/components/auth/PasswordField"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { LOGOS } from "@/constants/app"

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
      <div className="bg-white min-h-screen overflow-hidden px-4 relative">
        {/* Logo - positioned above center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230px]">
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
              Invalid Link
            </h1>
            
            <div className="space-y-6 text-center">
              <p className="text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <div className="text-center pt-4">
                <div className="flex items-center justify-center gap-2">
                  <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.48975 0.700195L0.989746 5.2002L5.48975 9.7002" stroke="#696969" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#696969] hover:text-gray-500 transition-colors"
                  >
                    Request a new link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - positioned 32px from bottom */}
        <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
          <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap font-inter">
            Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white min-h-screen overflow-hidden px-4 relative">
        {/* Logo - positioned above center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230px]">
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
          <div className="w-[372px] h-[206px] rounded-[8px] border border-gray-200 p-[48px] flex flex-col items-center justify-center gap-[24px] opacity-100 bg-white">
            <div className="flex justify-center">
              <div className="w-[25px] h-[25px] rounded-full bg-[#8247FF] flex items-center justify-center opacity-100">
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="w-[276px] h-[21px] opacity-100">
              <p className="text-center font-normal text-[14px] leading-[150%] tracking-[0%] text-[#2E2E2E]">
                Password has successfully been changed.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-[117px] h-[32px] rounded-[4px] gap-[10px] opacity-100 pt-[8px] pr-[24px] pb-[8px] pl-[24px] bg-[#080808] hover:bg-gray-800 border-0 flex items-center justify-center"
            >
              <span className="w-[69px] h-[21px] opacity-100 font-medium text-[14px] leading-[150%] tracking-[0%] text-white">
                Login Now
              </span>
            </Button>
          </div>
        </div>

        {/* Copyright - positioned 32px from bottom */}
        <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
          <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap font-inter">
            Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen overflow-hidden px-4 relative">
      {/* Logo - positioned above center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230px]">
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
            Reset Password
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-6">
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
              className="w-full md:w-[259px] h-[32px] opacity-100 rotate-0 gap-[10px] rounded-[4px] pt-[8px] pr-[20px] md:pr-[109px] pb-[8px] pl-[20px] md:pl-[109px] bg-[#080808] hover:bg-gray-800 disabled:opacity-50 mt-8 border-0 flex items-center justify-center mx-auto"
            >
              <span className="font-medium text-[12px] md:text-[14px] leading-[150%] tracking-[0%] text-[#EDEDED]" >
                {loading ? "Resetting..." : "Change Password"}
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
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright - positioned 32px from bottom */}
      <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 rotate-0 flex items-center justify-center">
        <p className="font-normal text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#A4A4A4] text-center whitespace-nowrap font-inter">
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
        </p>
      </div>
    </div>
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
