"use client"

import { useRouter } from "next/navigation"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import DashboardSimpleSidebar from "../components/sidebar/DashboardSimpleSidebar"
import Verify from "../components/verify/Verify"
import { ChevronRight } from "lucide-react"
import { usePublication } from "@/contexts/PublicationContext"


export default function DashboardPage() {
  const router = useRouter()
  const { 
    currentPublication, 
    getOwnedPublications, 
    getJoinedPublications,
    switchPublication,
    loading: publicationLoading 
  } = usePublication()

  if (publicationLoading) {
    return null
  }

  const ownedPublications = getOwnedPublications()
  const joinedPublications = getJoinedPublications()

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

          {/* Verification Alert - Only shows for unverified email/password users */}
          <Verify />

          {/* Your Publication Section */}
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">Your Publication</h2>
            {ownedPublications.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-4 items-center flex-1 w-full">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {ownedPublications[0]?.logoUrl ? (
                        <img 
                          src={`http://localhost:5000${ownedPublications[0].logoUrl}`} 
                          alt="publication logo" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load logo:', ownedPublications[0].logoUrl);
                            e.target.onerror = null;
                            e.target.src = "/icons/nib.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="text-violet-600 font-bold text-lg">
                            {ownedPublications[0]?.name?.charAt(0).toUpperCase() || "P"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {ownedPublications[0]?.name || "Publication Name"}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {ownedPublications[0]?.description || "Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Switch to owned publication first
                      switchPublication(ownedPublications[0]);
                      router.push(`/home?pub=${ownedPublications[0].id}`);
                    }}
                    className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                  >
                    Go to Publication
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src="/icons/nib.svg" alt="publication" className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No Publication Yet</h3>
                  <p className="text-xs text-gray-400">
                    Create your first publication to get started.
                  </p>
                  <button
                    onClick={() => router.push('/create-publication')}
                    className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
                  >
                    Create Publication
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Joined Publication Section */}
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">Joined Publications</h2>
            {joinedPublications.length > 0 ? (
              <div className="space-y-4">
                {joinedPublications.map((joinedPub) => (
                  <div key={joinedPub.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex gap-4 items-center flex-1 w-full">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {joinedPub.logoUrl ? (
                            <img 
                              src={`http://localhost:5000${joinedPub.logoUrl}`} 
                              alt={`${joinedPub.name} logo`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/icons/pen.svg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                {joinedPub.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{joinedPub.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {joinedPub.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`text-xs font-medium ${
                              joinedPub.role === 'editor' ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {joinedPub.role.charAt(0).toUpperCase() + joinedPub.role.slice(1)}
                            </span>
                            <span className="text-xs text-gray-400">
                              Joined {new Date(joinedPub.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          switchPublication(joinedPub);
                          router.push(`/posts/home?pub=${joinedPub.id}`);
                        }}
                        className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                      >
                        Go to Publication
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src="/icons/pen.svg" alt="publication" className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No Joined Publications</h3>
                  <p className="text-xs text-gray-400">
                    You haven't joined any publications yet. Accept an invitation to get started.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Multiple Publication Coming Soon */}
          <section className="bg-gray-50 rounded-lg py-16 text-center">
            <p className="text-gray-400 text-xs">Multiple Publication coming soon!</p>
          </section>
        </div>
      </main>
    </>
  )
}
