import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LOGOS } from "@/constants/app"

/**
 * Shared layout component for authentication pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form content
 * @param {string} props.title - Page title
 */
export default function AuthLayout({ children, title }) {
  return (
    <div className="bg-gray-50 flex flex-col items-center justify-center px-4 min-h-screen">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Image
            src={LOGOS.auth}
            alt="InkSigma Logo"
            width={200}
            height={60}
            className="mx-auto h-16 w-auto"
          />
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>

          {children}

          {/* Back to Website */}
          <div className="text-center pt-4">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go back to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}