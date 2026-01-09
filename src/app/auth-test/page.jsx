"use client"

import { useSession } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { clearAuthData, checkAuthStatus } from '@/utils/auth'

export default function AuthTestPage() {
  const { data: session, isPending } = useSession()
  const [serverAuthStatus, setServerAuthStatus] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog(`useSession - isPending: ${isPending}, session exists: ${!!session}, user exists: ${!!session?.user}`)
  }, [session, isPending])

  const handleCheckServerAuth = async () => {
    addLog('Checking server authentication...')
    const isAuthenticated = await checkAuthStatus()
    setServerAuthStatus(isAuthenticated)
    addLog(`Server auth result: ${isAuthenticated}`)
  }

  const handleClearAuth = () => {
    addLog('Clearing all auth data...')
    clearAuthData()
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleTestDashboard = () => {
    addLog('Navigating to dashboard...')
    window.location.href = '/dashboard'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border p-4 rounded bg-blue-50">
            <h2 className="font-semibold text-blue-800">Better Auth Session (useSession hook):</h2>
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>isPending:</strong> {isPending ? 'true' : 'false'}</p>
              <p><strong>session exists:</strong> {session ? 'true' : 'false'}</p>
              <p><strong>user exists:</strong> {session?.user ? 'true' : 'false'}</p>
              {session?.user && (
                <div className="mt-2 p-2 bg-white rounded">
                  <p><strong>User ID:</strong> {session.user.id}</p>
                  <p><strong>User Email:</strong> {session.user.email}</p>
                  <p><strong>User Name:</strong> {session.user.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border p-4 rounded bg-green-50">
            <h2 className="font-semibold text-green-800">Server Authentication Check:</h2>
            <div className="mt-2">
              <button 
                onClick={handleCheckServerAuth}
                className="bg-green-600 text-white px-4 py-2 rounded mr-4 text-sm"
              >
                Check Server Auth
              </button>
              <p className="mt-2 text-sm"><strong>Server Auth Status:</strong> {serverAuthStatus === null ? 'Not checked' : serverAuthStatus ? 'Authenticated' : 'Not authenticated'}</p>
            </div>
          </div>

          <div className="border p-4 rounded bg-red-50">
            <h2 className="font-semibold text-red-800">Clear Authentication:</h2>
            <div className="mt-2 space-y-2">
              <button 
                onClick={handleClearAuth}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm block"
              >
                Clear All Auth Data & Reload
              </button>
              <button 
                onClick={handleTestDashboard}
                className="bg-purple-600 text-white px-4 py-2 rounded text-sm block"
              >
                Test Dashboard Access
              </button>
            </div>
          </div>

          <div className="border p-4 rounded bg-gray-50">
            <h2 className="font-semibold text-gray-800">Browser Storage:</h2>
            <div className="mt-2 text-xs space-y-1">
              <p><strong>localStorage keys:</strong> {typeof window !== 'undefined' ? Object.keys(localStorage).join(', ') || 'None' : 'N/A'}</p>
              <p><strong>sessionStorage keys:</strong> {typeof window !== 'undefined' ? Object.keys(sessionStorage).join(', ') || 'None' : 'N/A'}</p>
              <p><strong>cookies:</strong> {typeof document !== 'undefined' ? document.cookie || 'None' : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="border p-4 rounded bg-yellow-50">
          <h2 className="font-semibold text-yellow-800">Debug Logs:</h2>
          <div className="mt-2 h-96 overflow-y-auto bg-white p-2 rounded text-xs font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  )
}