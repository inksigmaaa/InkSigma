"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

/**
 * Reusable password input field with toggle visibility
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {number} props.minLength - Minimum length
 * @param {number} props.maxLength - Maximum length
 */
export default function PasswordField({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange,
  minLength,
  maxLength
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 pr-12 focus-visible:ring-0 focus-visible:border-gray-900"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}