"use client"

import { useSession } from '@/lib/auth-client'
import { useState } from 'react'
import { clearAuthData, checkAuthStatus } from '@/utils/auth'

export default function AuthTestPage() {
  const { data: session, isPending } = useSession()
  const [serverAuthStatus, setServerAuthStatus] = useState(null)

  const handleCheckServerAuth = async () => {
    const isAuthenticated = await checkAuthStatus()
    setServerAuthStatus(isAuthenticated)
  }

  const handleClearAuth = () => {
    clearAuthData()
    window.location.reload()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Better Auth Session (useSession hook):</h2>
          <p>isPending: {isPending ? 'true' : 'false'}</p>
          <p>session exists: {session ? 'true' : 'false'}</p>
          <p>user exists: {session?.user ? 'true' : 'false'}</p>
          {session?.user && (
            <div>
              <p>User ID: {session.user.id}</p>
              <p>User Email: {session.user.email}</p>
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">Server Authentication Check:</h2>
          <button 
            onClick={handleCheckServerAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            Check Server Auth
          </button>
          <p>Server Auth Status: {serverAuthStatus === null ? 'Not checked' : serverAuthStatus ? 'Authenticated' : 'Not authenticated'}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">Clear Authentication:</h2>
          <button 
            onClick={handleClearAuth}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear All Auth Data & Reload
          </button>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">Browser Storage:</h2>
          <p>localStorage keys: {typeof window !== 'undefined' ? Object.keys(localStorage).join(', ') : 'N/A'}</p>
          <p>sessionStorage keys: {typeof window !== 'undefined' ? Object.keys(sessionStorage).join(', ') : 'N/A'}</p>
          <p>cookies: {typeof document !== 'undefined' ? document.cookie : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}