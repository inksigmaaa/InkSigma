"use client"

import ToastExample from "@/components/examples/ToastExample"
import { Toaster } from "@/components/ui/toaster"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Component Testing</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <ToastExample />
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}