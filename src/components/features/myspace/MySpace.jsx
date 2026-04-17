"use client";

import { useRouter } from "next/navigation";
import { usePublication } from "@/contexts/PublicationContext";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/utils/imageUrl";

export default function MySpace() {
  const router = useRouter();
  const {
    currentPublication,
    loading,
    getOwnedPublications,
    getJoinedPublications,
    switchPublication,
  } = usePublication();

  if (loading) {
    return (
      <main className="flex-1 bg-white px-4 sm:px-8 py-6 sm:py-10 mt-[120px] md:mt-[120px] pb-24 md:pb-0 md:ml-[165px]">
        <div className="max-w-[600px] mx-auto">
          <div className="text-center text-gray-500">
            Loading your publications...
          </div>
        </div>
      </main>
    );
  }

  const ownedPublications = getOwnedPublications();
  const joinedPublications = getJoinedPublications();

  const handlePublicationClick = (publication) => {
    // Switch publication and navigate using router
    switchPublication(publication);
    // Use router for client-side navigation
    if (publication.isOwner) {
      router.push(`/${publication.subdomain}/home`);
    } else {
      router.push(`/${publication.subdomain}/allArticle`);
    }
  };

  const getPublicationLogoSrc = (logoUrl) =>
    getImageUrl(logoUrl) || "/icons/nib.svg";

  return (
    <main className="flex-1 bg-white px-4 sm:px-8 py-6 sm:py-10 mt-[120px] md:mt-[120px] pb-24 md:pb-0 md:ml-[165px]">
      <div className="max-w-[600px] mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
            My Space
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed mb-4 px-4">
            Manage all your publications in one place. Switch between your owned
            publications and those you&apos;ve joined as a member.
          </p>
        </div>

        {/* Your Publications Section */}
        {ownedPublications.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">
              Your Publications
            </h2>
            <div className="space-y-4">
              {ownedPublications.map((publication) => (
                <div
                  key={publication.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-4 items-center flex-1 w-full">
                      <Avatar className="w-14 h-14 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <AvatarImage
                          src={getPublicationLogoSrc(publication.logoUrl)}
                          alt={`${publication.name} logo`}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-bold text-lg">
                          {publication.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {publication.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-violet-600 font-medium">
                            Owner
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePublicationClick(publication)}
                      className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap"
                    >
                      Go to Publication
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Joined Publications Section */}
        {joinedPublications.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-5">
              Joined Publications
            </h2>
            <div className="space-y-4">
              {joinedPublications.map((publication) => (
                <div
                  key={publication.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-4 items-center flex-1 w-full">
                      <Avatar className="w-14 h-14 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <AvatarImage
                          src={getPublicationLogoSrc(publication.logoUrl)}
                          alt={`${publication.name} logo`}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback className="w-full h-full bg-blue-100 text-blue-600 font-bold text-lg">
                          {publication.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {publication.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span
                            className={`text-xs font-medium ${
                              publication.role === "editor"
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {publication.role?.charAt(0).toUpperCase() +
                              publication.role?.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            Joined{" "}
                            {new Date(publication.joinedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePublicationClick(publication)}
                      className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap"
                    >
                      Go to Publication
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {ownedPublications.length === 0 && joinedPublications.length === 0 && (
          <section className="bg-gray-50 rounded-lg py-16 text-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              No Publications Yet
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Create your first publication or accept an invitation to get
              started.
            </p>
            <button
              onClick={() => router.push("/create-publication")}
              className="bg-violet-600 text-white px-6 py-2 rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
            >
              Create Publication
            </button>
          </section>
        )}

        {/* Current Publication Indicator */}
        {currentPublication && (
          <section className="bg-violet-50 rounded-lg p-4 border border-violet-200">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 bg-violet-100 flex items-center justify-center">
                <AvatarImage
                  src={getPublicationLogoSrc(currentPublication.logoUrl)}
                  alt={currentPublication.name}
                  className="w-full h-full object-cover"
                />
                <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-bold text-sm">
                  {currentPublication.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-violet-900">
                  Currently Active
                </p>
                <p className="text-xs text-violet-700">
                  {currentPublication.name}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
