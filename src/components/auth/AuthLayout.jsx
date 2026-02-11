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
    <div className="bg-white flex flex-col items-center justify-center flex-1 min-h-0 px-4 pb-[60px] md:pb-[80px]">
      <div className="w-full max-w-[260px] h-auto opacity-100 rotate-0 flex flex-col">
        {/* Logo - fixed position */}
        <div className="text-center mt-[10px]">
          <Image
            src={LOGOS.auth}
            alt="InkSigma Logo"
            width={127}
            height={41.843929290771484}
            className="mx-auto w-[100px] md:w-[127px] h-auto"
          />
        </div>

        {/* Title - fixed position with logo */}
        <div className="mt-[45px] md:mt-[55px]">
          <h1 className={`${title === "Welcome, Sign up here!" ? "w-[179px] h-[28px]" : "w-auto md:w-[85px] h-auto md:h-[28px]"} font-bold text-[14px] md:text-[16px] leading-[28px] tracking-[0%] text-[#2E2E2E] opacity-100 rotate-0 mx-auto text-center ${titleClassName || ''}`}>
            {title}
          </h1>
        </div>

        {/* Form content - with spacing from title */}
        <div className="mt-[35px] md:mt-[45px]">
          {children}
        </div>
      </div>
    </div>
  )
}
