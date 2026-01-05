"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

/**
 * Password input field with show/hide toggle
 */
export default function PasswordField({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange,
  className = ""
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-gray-900"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
