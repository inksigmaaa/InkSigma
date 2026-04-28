"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LOGOS } from "@/constants/app"
import { getApiBase } from "@/utils/apiBase"
import { CheckCircle2, XCircle } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [status, setStatus] = useState("checking")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    let cancelled = false

    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus("error")
        setMessage("This verification link is invalid or incomplete.")
        return
      }

      try {
        const response = await fetch(`${getApiBase()}/api/custom/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, email }),
        })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || "Verification failed")
        }

        if (!cancelled) {
          setStatus("success")
          setMessage("Your email has been verified.")
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error")
          setMessage(error.message || "This verification link is invalid or has expired.")
        }
      }
    }

    verifyEmail()

    return () => {
      cancelled = true
    }
  }, [email, token])

  const isSuccess = status === "success"
  const isError = status === "error"

  return (
    <div className="bg-white min-h-screen overflow-hidden px-4 relative">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-[230px]">
        <Image
          src={LOGOS.auth}
          alt="InkSigma Logo"
          width={127}
          height={41.843929290771484}
          className="mx-auto w-[100px] md:w-[127px] h-auto"
        />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-[360px] rounded-[8px] border border-gray-200 p-8 flex flex-col items-center justify-center gap-5 bg-white text-center">
          {isSuccess ? (
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          ) : isError ? (
            <XCircle className="w-10 h-10 text-red-500" />
          ) : (
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}

          <div className="space-y-2">
            <h1 className="font-semibold text-[16px] leading-[150%] text-[#2E2E2E]">
              {isSuccess ? "Email verified" : isError ? "Verification failed" : "Checking link"}
            </h1>
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          <Button asChild className="h-[32px] rounded-[4px] bg-[#080808] hover:bg-gray-800">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>

      <div className="absolute bottom-[32px] left-1/2 transform -translate-x-1/2 w-full h-[15px] opacity-100 flex items-center justify-center">
        <p className="font-normal text-[10px] md:text-[12px] leading-[100%] text-[#A4A4A4] text-center whitespace-nowrap">
          Copyright © 2023 designed & developed by Inksigma, a Zemuria Inc. brand
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
