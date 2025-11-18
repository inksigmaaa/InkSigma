"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import DashboardSimpleSidebar from "../components/sidebar/DashboardSimpleSidebar"
import { ChevronRight, AlertCircle } from "lucide-react"


export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

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
      <main className="flex-1 bg-white px-4 sm:px-8 py-6 sm:py-10 mt-[120px] md:mt-[120px] pb-24 md:pb-0 md:ml-[165px]">
        <div className="max-w-[600px] mx-auto space-y-6 sm:space-y-8">
          {/* Welcome Banner */}
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Welcome to InkSigma</h1>
            <p className="text-xs text-gray-500 leading-relaxed mb-4 px-4">
              Generate a publication and embark on crafting numerous articles showcasing your innovative ideas, thereby disseminating them to the global audience.
            </p>
            <button
              onClick={() => router.push('/profile-settings')}
              className="text-purple-500 hover:text-purple-600 text-xs flex items-center gap-1 mx-auto"
            >
              Complete your profile
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Verification Alert */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <p className="text-xs text-purple-900">Your Account hasn't been verified yet.</p>
            </div>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-md text-xs transition-colors whitespace-nowrap w-full sm:w-auto">
              Verify your Account
            </button>
          </div>

          {/* Your Publication Section */}
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">Your Publication</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-4 items-center flex-1 w-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/nib.svg" alt="publication" className="w-14 h-14 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Publication Name</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/home')}
                  className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  Go to Publication
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* Joined Publication Section */}
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">Joined Publication</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-4 items-center flex-1 w-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/pen.svg" alt="publication" className="w-14 h-14 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Publication Name</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/home')}
                  className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  Go to Publication
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* Multiple Publication Coming Soon */}
          <section className="bg-gray-50 rounded-lg py-16 text-center">
            <p className="text-gray-400 text-xs">Multiple Publication coming soon!</p>
          </section>
        </div>

        {/* Send Feedback Button */}
        <div className="hidden md:block fixed bottom-8 left-8">
          <button className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md border border-gray-200 bg-white">
            Send Feedback
          </button>
        </div>
      </main>
    </>
  )
}
