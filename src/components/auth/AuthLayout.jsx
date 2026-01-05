"use client"

import Image from "next/image"
import { LOGOS } from "@/constants/app"

/**
 * Shared layout component for authentication pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form content
 * @param {string} props.title - Page title
 * @param {string} props.titleClassName - Custom className for title
 */
export default function AuthLayout({ children, title, titleClassName }) {
  return (
    <div className="bg-white flex flex-col items-center justify-center px-4 min-h-screen mt-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            src={LOGOS.auth}
            alt="InkSigma Logo"
            width={200}
            height={60}
            className="mx-auto mb-8"
          />
          <h1 className={`text-2xl font-bold text-gray-900 ${titleClassName || ''}`}>
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
