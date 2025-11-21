"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import DashboardSimpleSidebar from "../components/sidebar/DashboardSimpleSidebar"
import Verify from "../components/verify/Verify"
import UserAvatar from "@/components/ui/UserAvatar"

export default function ProfileSettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bio, setBio] = useState("")

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <NavbarLoggedin />
      <DashboardSimpleSidebar />
      <Verify />
      <div className="min-h-screen bg-white flex justify-center p-4 sm:p-6 md:p-8 pt-[140px] md:pt-32 md:pl-64 pb-24 md:pb-8">
        <div className="w-full max-w-[800px] min-h-[927px] space-y-8">
          <h1 className="text-lg font-bold text-gray-900 text-center">Profile Settings</h1>

          <div className="flex flex-col items-center">

            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  opacity: 1,
                  borderRadius: '52px',
                  overflow: 'hidden'
                }}
              >
                <UserAvatar
                  user={session?.user}
                  size="xl"
                  className="w-full h-full"
                />
              </div>

              {/* Change/Remove buttons */}
              <div className="flex gap-4 mt-4">
                <button className="text-purple-500 hover:text-purple-600 text-sm font-medium">
                  Change
                </button>
                <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                  Remove
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="w-full max-w-[258.5px] mt-12 space-y-8">
              {/* Profile Name */}
              <div>
                <label className="block text-black font-bold text-base mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={32}
                  placeholder="Enter your Profile name"
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 placeholder-gray-300 focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-black font-bold text-base mb-2">
                  Username
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={20}
                  placeholder="Enter your username"
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 placeholder-gray-300 focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-black font-bold text-base mb-2">
                  Email ID
                </label>
                <input
                  type="email"
                  minLength={5}
                  maxLength={254}
                  placeholder="Enter your Email ID"
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 placeholder-gray-300 focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-black font-bold text-base mb-2">
                  Bio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Write your bio"
                    maxLength={200}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 pr-12 text-sm text-gray-400 placeholder-gray-300 focus:outline-none focus:border-gray-500"
                  />
                  <span className="absolute right-0 bottom-2 text-xs text-gray-400">{bio.length}/200</span>
                </div>
              </div>

              {/* Reset Account Password */}
              <div className="flex justify-center mt-8">
                <button
                  className="text-gray-500 hover:text-gray-700 border-b border-gray-500 text-sm"
                  style={{ width: '162px', height: '16px' }}
                  onClick={() => setShowResetModal(true)}
                >
                  Reset Account Password
                </button>
              </div>

              {/* Save Button */}
              <div className="flex justify-center mt-8">
                <button
                  className="bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center"
                  style={{
                    width: '259px',
                    height: '32px',
                    borderRadius: '4px'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Do you want to reset your password?
            </h2>
            <p className="text-gray-500 mb-8">
              we will send you a link to your Email and You will be logged out
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setShowSuccessModal(true)
                }}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mail Sent
              </h2>
              <p className="text-gray-500">
                A link has been to your registered Email ID
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
