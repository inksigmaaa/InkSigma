"use client"

import { useState } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Eye, EyeOff } from "lucide-react"

/**
 * Reusable Password Input Component with Show/Hide Toggle
 * Can be used anywhere in the app for password inputs
 */
export default function PasswordInput({ 
  id,
  name,
  placeholder = "Enter password",
  value,
  onChange,
  className = "",
  disabled = false,
  required = false,
  minLength,
  maxLength,
  autoComplete = "current-password",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={`relative ${className}`}>
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-500 font-medium"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={disabled ? -1 : 0}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
