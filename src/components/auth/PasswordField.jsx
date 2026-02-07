"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Password input field with show/hide toggle
 */
export default function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  className = "",
  minLength,
  maxLength,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`w-full md:w-[258.5px] h-auto md:h-[55px] gap-[12px] opacity-100 rotate-0 ${className}`}>
      <Label htmlFor={id} className="w-auto md:w-[37px] h-auto md:h-[16px] font-semibold text-[12px] md:text-[14px] leading-[100%] tracking-[0%] text-[#2E2E2E] opacity-100 rotate-0">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          className="border-0 border-b border-gray-300 rounded-none bg-transparent px-2 py-2 pr-12 md:pr-16 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 focus:ring-offset-0 w-full placeholder:text-[#C8C8C8] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
          required
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1  focus:outline-none  focus:ring-gray-300 focus:ring-opacity-50 font-medium text-[10px] md:text-[12px] leading-[100%] tracking-[0%] text-[#808080]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  )
}
