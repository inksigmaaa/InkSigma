"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import PasswordField from "@/components/auth/PasswordField"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
import { APP_CONFIG } from "@/constants/app"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login form submitted:', formData)
  }

  const handleGoogleLogin = () => {
    console.log('Google login clicked')
  }

  const handleMagicLink = () => {
    console.log('Magic link login clicked')
  }

  return (
    <AuthLayout title="Login here!">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange('password')}
        />
        <div className="text-right">
          <Link 
            href="/forgot-password" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <Button 
          type="submit"
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
        >
          Login
        </Button>
        <Button 
          type="button"
          variant="outline"
          onClick={handleMagicLink}
          className="w-full bg-white text-black border-gray-300 hover:bg-gray-50 rounded-md py-3"
        >
          Login with Magic link
        </Button>
      </form>
      <div className="text-center text-sm text-gray-600">
        New to {APP_CONFIG.name}?{" "}
        <Link 
          href="/signup" 
          className="text-gray-900 underline hover:text-gray-700 transition-colors"
        >
          Create a Account
        </Link>
      </div>
      <div className="text-center text-gray-400">
        or
      </div>
      <GoogleAuthButton 
        text="Login With Google"
        onClick={handleGoogleLogin}
      />
    </AuthLayout>
  )
}