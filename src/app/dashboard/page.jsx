"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardNavbar from "@/components/DashboardNavbar"
import DashboardSidebar from "@/components/DashboardSidebar"
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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Container */}
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg mb-4 shadow-sm">
        <DashboardNavbar />
      </div>

      {/* Main Layout with Sidebar and Content */}
      <div className="max-w-[1200px] mx-auto flex gap-4">
        {/* Sidebar Container */}
        <div className="bg-white rounded-lg shadow-sm">
          <DashboardSidebar />
        </div>

        {/* Content Area - Single Container */}
        <main className="flex-1 bg-white rounded-lg shadow-sm px-16 py-10">
          <div className="max-w-[600px] mx-auto space-y-8">
            {/* Welcome Banner */}
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900 mb-3">Welcome to InkSigma</h1>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Generate a publication and embark on crafting numerous articles showcasing your innovative ideas, thereby disseminating them to the global audience.
              </p>
              <button className="text-purple-500 hover:text-purple-600 text-xs flex items-center gap-1 mx-auto">
                Complete your profile
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Verification Alert */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <p className="text-xs text-purple-900">Your Account hasn't been verified yet.</p>
              </div>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-md text-xs transition-colors whitespace-nowrap">
                Verify your Account
              </button>
            </div>

            {/* Your Publication Section */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 mb-5">Your Publication</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <img src="/icons/nib.svg" alt="publication" className="w-14 h-14 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Publication Name</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push("/posts")}
                    className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap ml-4"
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <img src="/icons/pen.svg" alt="publication" className="w-14 h-14 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Publication Name</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push("/posts")}
                    className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap ml-4"
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
          <div className="fixed bottom-8 left-8">
            <button className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md border border-gray-200 bg-white">
              Send Feedback
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
