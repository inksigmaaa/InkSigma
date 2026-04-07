"use client"

import { useState } from "react"
import PasswordField from "@/components/auth/PasswordField"
import PasswordInput from "@/components/ui/PasswordInput"

export default function PasswordDemoPage() {
  const [authPassword, setAuthPassword] = useState("")
  const [simplePassword, setSimplePassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Password Input Components Demo
          </h1>
          
          <div className="space-y-8">
            {/* Auth Style Password Field */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Auth Style Password Field
              </h2>
              <p className="text-gray-600 mb-4">
                Used in login, signup, and reset password forms with custom styling
              </p>
              <PasswordField
                id="auth-password"
                label="Password"
                placeholder="Enter your password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                minLength={8}
              />
            </div>

            {/* Simple Password Input */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Simple Password Input
              </h2>
              <p className="text-gray-600 mb-4">
                Reusable component for any form with standard styling
              </p>
              <div className="space-y-2">
                <label htmlFor="simple-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <PasswordInput
                  id="simple-password"
                  name="password"
                  placeholder="Enter your password"
                  value={simplePassword}
                  onChange={(e) => setSimplePassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {/* Confirm Password Example */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Confirm Password Example
              </h2>
              <p className="text-gray-600 mb-4">
                Example of using multiple password inputs in a form
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <PasswordInput
                    id="new-password"
                    name="newPassword"
                    placeholder="Enter new password"
                    value={simplePassword}
                    onChange={(e) => setSimplePassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              {simplePassword && confirmPassword && simplePassword !== confirmPassword && (
                <p className="text-red-600 text-sm mt-2">Passwords do not match</p>
              )}
            </div>

            {/* Features List */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Features Implemented
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Show/Hide password toggle with text buttons
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Proper accessibility with aria-labels
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Hover and focus states for better UX
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Keyboard navigation support
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Disabled state handling
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Customizable styling and props
                </li>
              </ul>
            </div>

            {/* Usage Examples */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Usage Examples
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Auth Style (existing forms):</h3>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`<PasswordField
  id="password"
  label="Password"
  placeholder="Enter your password"
  value={password}
  onChange={handleChange}
  minLength={8}
/>`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Simple Style (new forms):</h3>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`<PasswordInput
  id="password"
  name="password"
  placeholder="Enter password"
  value={password}
  onChange={handleChange}
  required
  minLength={8}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}