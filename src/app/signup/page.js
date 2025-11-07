"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"
import PasswordField from "@/components/auth/PasswordField"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
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
    console.log('Signup form submitted:', formData)
  }

  const handleGoogleSignup = () => {
    console.log('Google signup clicked')
  }

  return (
    <AuthLayout title="Welcome, Sign up here!">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-900"
            required
          />
        </div>
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
          label="Create Password"
          placeholder="Create your password"
          value={formData.password}
          onChange={handleInputChange('password')}
        />
        <Button 
          type="submit"
          className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3"
        >
          Sign Up
        </Button>
      </form>
      <div className="text-center text-sm text-gray-600">
        Already a User?{" "}
        <Link href="/login" className="text-gray-900 underline hover:text-gray-700 transition-colors">
          Login
        </Link>
      </div>
      <div className="text-center text-gray-400">
        or
      </div>
      <GoogleAuthButton 
        text="Signup With Google"
        onClick={handleGoogleSignup}
      />
    </AuthLayout>
  )
}