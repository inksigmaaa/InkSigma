"use client"

import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import { useState } from "react"
import { useVerifyBanner } from "@/hooks/useVerifyBanner"

export default function MembersPage() {
  const [showExitModal, setShowExitModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  
  // Check if verify banner should be shown
  const showVerifyBanner = useVerifyBanner()

  const handleExitClick = (member) => {
    setSelectedMember(member)
    setShowExitModal(true)
  }

  const handleRemoveClick = (member) => {
    console.log("Remove button clicked for:", member.name)
    setSelectedMember(member)
    setShowRemoveModal(true)
    console.log("showRemoveModal set to true")
  }

  const handleConfirmExit = () => {
    // Handle the exit logic here
    if (selectedMember) {
      console.log(`${selectedMember.name} has left the publication`)
    }
    setShowExitModal(false)
    setSelectedMember(null)
  }

  const handleConfirmRemove = () => {
    // Handle the remove logic here
    if (selectedMember) {
      console.log(`${selectedMember.name} has been removed from the publication`)
    }
    setShowRemoveModal(false)
    setSelectedMember(null)
  }

  const handleInvite = (e) => {
    e.preventDefault()
    
    // Check if email is empty
    if (!email || email.trim() === "") {
      setEmailError("Email is required")
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address only")
      return
    }

    // Handle invite logic here
    console.log(`Invite sent to: ${email}`)
    alert(`Invite sent successfully to: ${email}`)
    setEmail("")
    setEmailError("")
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError("")
    }
  }

  const members = [
    { id: 1, name: "Special Batista", role: "Author", canExit: true, image: "/images/icons/profileuser.svg" },
    { id: 2, name: "John Cena", role: "Editor", canExit: false, image: "/images/icons/profileuser.svg" },
    { id: 3, name: "The Rock", role: "Editor", canExit: false, image: "/images/icons/profileuser.svg" },
    { id: 4, name: "Randy Ortan", role: "Editor", canExit: false, image: "/images/icons/profileuser.svg" },
  ]

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      <div className={`absolute left-1/2 -translate-x-1/2 ${showVerifyBanner ? 'top-[215px]' : 'top-[160px]'} w-full max-w-[1034px] z-10 px-5 pb-32 md:pb-0`}>
        <div className="ml-0 md:ml-[230px]">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Members</h1>

          <div className="space-y-0">
            {members.map((member) => (
              <div key={member.id} className="grid grid-cols-3 items-center py-4 border-b border-gray-200 gap-4">
                {/* Left Column - Profile */}
                <div className="flex items-center gap-3">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="text-base font-semibold text-gray-900">{member.name}</span>
                </div>

                {/* Middle Column - Role (Centered) */}
                <div className="flex justify-center">
                  <span className="text-gray-400 text-sm">{member.role}</span>
                </div>

                {/* Right Column - Action */}
                <div className="flex justify-end gap-3">
                  {member.canExit ? (
                    <button 
                      onClick={() => handleExitClick(member)}
                      className="bg-red-50 text-red-500 px-6 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      Exit
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xl">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Do you want to leave this publication?
            </h2>
            <p className="text-gray-500 mb-8 text-center">
              By leaving, you will no longer receive updates or notifications from this publication.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Do you want to remove the member?
            </h2>
            <p className="text-gray-400 mb-8 text-center">
              The member will be removed from the publication.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium text-lg"
              >
                Close
              </button>
              <button
                onClick={handleConfirmRemove}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium text-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
