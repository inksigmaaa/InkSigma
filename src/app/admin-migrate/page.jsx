"use client"

import { useState } from "react"

export default function AdminMigratePage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMigrate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/publication/migrate-existing", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Migrate Existing Users</h1>
        <p className="text-gray-600 mb-6">
          This will create default publications for all existing users who don't have one.
        </p>
        
        <button
          onClick={handleMigrate}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Migrating..." : "Run Migration"}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded ${result.error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
