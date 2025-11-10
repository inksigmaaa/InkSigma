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
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="flex flex-col md:flex-row">
        <DashboardSidebar />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 lg:p-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">Welcome to InkSigma</h1>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 max-w-2xl mx-auto">
                Generate a publication and embark on crafting numerous articles showcasing your innovative ideas, thereby disseminating them to the global audience.
              </p>
              <button className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm md:text-base">
                Complete your profile
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Alert */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <p className="text-sm md:text-base text-purple-900 font-medium">Your Account hasn't been verified yet.</p>
              </div>
              <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 rounded-md font-medium transition-colors text-sm md:text-base">
                Verify your Account
              </button>
            </div>

            {/* Your Publication Section */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Your Publication</h2>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                    {/* Publication Icon */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <img src="/icons/nib.svg" alt="publication" className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
                    </div>

                    {/* Publication Info */}
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">Publication Name</h3>
                      <p className="text-xs md:text-sm text-gray-500 leading-[150%]" style={{ fontFamily: 'Public Sans' }}>
                        Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                      </p>
                    </div>
                  </div>

                  {/* Go to Publication Link */}
                  <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm whitespace-nowrap self-start sm:self-auto">
                    Go to Publication
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Joined Publication Section */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Joined Publication</h2>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                    {/* Publication Icon */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <img src="/icons/pen.svg" alt="publication" className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
                    </div>

                    {/* Publication Info */}
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">Publication Name</h3>
                      <p className="text-xs md:text-sm text-gray-500 leading-[150%]" style={{ fontFamily: 'Public Sans' }}>
                        Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card
                      </p>
                    </div>
                  </div>

                  {/* Go to Publication Link */}
                  <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm whitespace-nowrap self-start sm:self-auto">
                    Go to Publication
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Multiple Publication Coming Soon */}
            <section className="text-center py-8 md:py-12">
              <p className="text-gray-400 text-base md:text-lg">Multiple Publication coming soon!</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
