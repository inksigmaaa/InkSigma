"use client"

import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import { useState } from "react"

export default function MembersPage() {
  const [showExitModal, setShowExitModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const handleExitClick = (member) => {
    setSelectedMember(member)
    setShowExitModal(true)
  }

  const handleConfirmExit = () => {
    // Handle the exit logic here
    if (selectedMember) {
      console.log(`${selectedMember.name} has left the publication`)
    }
    setShowExitModal(false)
    setSelectedMember(null)
  }

  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState("Select Role")

  const members = [
    { id: 1, name: "Special Batista", role: "Editor", status: "active", image: "/images/icons/profileuser.svg" },
    { id: 2, name: "Special Batista", role: "Author", status: "active", image: "/images/icons/profileuser.svg" },
    { id: 3, name: "Mocas Nicota", role: null, status: "pending", image: "/images/icons/profileuser.svg" },
    { id: 4, name: "Mocas Nicota", role: null, status: "expired", image: "/images/icons/profileuser.svg" },
  ]

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <div className="absolute left-1/2 -translate-x-1/2 top-[140px] md:top-[200px] w-full max-w-[1034px] z-10 px-5 pb-32 md:pb-0">
        <div className="ml-0 md:ml-[230px]">
          {/* Add Member Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Member</h2>
            
            <div className="flex items-end gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the Email"
                  className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 placeholder:text-gray-400"
                />
              </div>
              
              <div className="min-w-[140px] relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer appearance-none"
                >
                  <option value="Select Role">Select Role</option>
                  <option value="Editor">Editor</option>
                  <option value="Author">Author</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              <button className="px-6 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap">
                Send Invite
              </button>
            </div>
          </div>

          {/* Members List */}
          <h1 className="text-xl font-bold text-gray-900 mb-6">Members</h1>

          <div className="space-y-0">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-6 border-b border-gray-200">
                {/* Left - Profile */}
                <div className="flex items-center gap-3">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="text-base font-medium text-gray-900">{member.name}</span>
                </div>

                {/* Middle - Role/Status */}
                <div className="flex items-center">
                  {member.status === "active" && (
                    <span className="text-gray-500 text-sm">{member.role}</span>
                  )}
                  {member.status === "pending" && (
                    <span className="px-4 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-full">
                      Pending
                    </span>
                  )}
                  {member.status === "expired" && (
                    <span className="px-4 py-1 text-sm font-medium text-gray-400 border border-gray-300 rounded-full">
                      Expired
                    </span>
                  )}
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                  {member.status === "pending" && (
                    <button className="px-4 py-1.5 text-sm font-medium text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition-colors">
                      Resend
                    </button>
                  )}
                  {member.status === "expired" && (
                    <button className="px-4 py-1.5 text-sm font-medium text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition-colors">
                      Re-invite
                    </button>
                  )}
                  <button 
                    onClick={() => handleExitClick(member)}
                    className="px-4 py-1.5 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </>
  )
}
