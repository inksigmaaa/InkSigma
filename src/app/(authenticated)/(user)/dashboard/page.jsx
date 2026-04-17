"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Verify from "@/components/features/verify/Verify";
import { ChevronRight } from "lucide-react";
import { usePublication } from "@/contexts/PublicationContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { getApiBase } from "@/utils/apiBase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const PROFILE_COMPLETION_CACHE_KEY = "dashboard-profile-complete";
  const router = useRouter();
  const {
    getOwnedPublications,
    getJoinedPublications,
    switchPublication,
    loadUserPublications,
    loading: publicationLoading,
  } = usePublication();
  const API_URL = getApiBase();
  const [profileCompletionState, setProfileCompletionState] = useState(() => {
    if (typeof window === "undefined") return "unknown";
    const cached = sessionStorage.getItem(PROFILE_COMPLETION_CACHE_KEY);
    if (cached === "true") return "complete";
    if (cached === "false") return "incomplete";
    return "unknown";
  });

  // Effect to handle potential context refresh issues
  useEffect(() => {
    // If we're not loading and have no publications, try refreshing once
    // This handles the case where a user just created a publication but context wasn't updated
    if (!publicationLoading) {
      const ownedPublications = getOwnedPublications();
      const joinedPublications = getJoinedPublications();

      if (ownedPublications.length === 0 && joinedPublications.length === 0) {
        const hasRefreshed = sessionStorage.getItem("dashboard-refreshed");
        if (!hasRefreshed) {
          console.log("No publications found, refreshing context...");
          sessionStorage.setItem("dashboard-refreshed", "true");
          loadUserPublications();
        }
      } else {
        // Clear the refresh flag when publications are found
        sessionStorage.removeItem("dashboard-refreshed");
      }
    }
  }, [
    publicationLoading,
    loadUserPublications,
    getOwnedPublications,
    getJoinedPublications,
  ]);

  // Check profile completion immediately; use cache to avoid CTA flicker on repeated visits.
  useEffect(() => {
    const controller = new AbortController();

    const checkProfileCompletion = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const isComplete = !!(
            data.profileName?.trim() &&
            data.username?.trim() &&
            data.bio?.trim()
          );
          const nextState = isComplete ? "complete" : "incomplete";
          setProfileCompletionState(nextState);
          sessionStorage.setItem(
            PROFILE_COMPLETION_CACHE_KEY,
            String(isComplete),
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error checking profile completion:", error);
        }
      }
    };

    checkProfileCompletion();

    return () => controller.abort();
  }, [API_URL, PROFILE_COMPLETION_CACHE_KEY]);

  // Show content immediately - don't wait for publications to load
  // Publications will load in background and update the UI when ready

  const ownedPublications = getOwnedPublications();
  const joinedPublications = getJoinedPublications();
  const getPublicationLogoSrc = (logoUrl) =>
    logoUrl && !logoUrl.includes('/uploads/')
      ? logoUrl.startsWith("http://") || logoUrl.startsWith("https://")
        ? logoUrl
        : `${API_URL}${logoUrl}`
      : "/icons/nib.svg";

  return (
    <AuthGuard>
      <main className="flex-1 bg-white px-4 sm:px-8 pt-0 mt-[120px] md:mt-[120px] sm:mt-[80px] pb-24 md:pb-0 ml-0 md:ml-[197px] relative z-[1]">
        <div className="w-full max-w-[819px] mx-auto space-y-6 sm:space-y-8">
          {/* Welcome Banner */}
          <div className="w-full max-w-[819px] min-h-[184px] rounded-[4px] pt-[24px] px-4 sm:px-[155px] pb-[24px] gap-[5px] opacity-100 border border-[#EDEDED] flex flex-col items-center justify-center mx-auto">
            <h1
              className="w-full max-w-[166px] h-[28px] opacity-100 font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] text-center"
              style={{ fontFamily: "Public Sans" }}
            >
              Welcome to InkSigma
            </h1>
            <p
              className="w-full max-w-[536px] min-h-[42px] opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-center text-[#696969] px-4 sm:px-0"
              style={{ fontFamily: "Public Sans" }}
            >
              Generate a publication and embark on crafting numerous articles
              showcasing your innovative ideas, thereby disseminating them to
              the global audience.
            </p>
            {profileCompletionState === "incomplete" && (
              <button
                onClick={() => router.push("/profile-settings")}
                className="min-h-[26px] pt-[8px] pr-[4px] pb-[8px] pl-[4px] opacity-100 flex items-center justify-center mt-2"
              >
                <span
                  className="opacity-100 font-medium text-[14px] leading-[150%] tracking-[0%] inline-block bg-gradient-to-r from-[#A941FB] to-[rgba(120,100,240,0.92)] bg-clip-text text-transparent"
                  style={{
                    fontFamily: "Public Sans",
                  }}
                >
                  Complete your profile
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A941FB] ml-1" />
              </button>
            )}
          </div>

          {/* Verification Alert - Only shows for unverified email/password users */}
          <Verify />

          {/* Your Publication Section */}
          <section>
            <h2
              className="w-full max-w-[125px] h-[28px] opacity-100 font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] mb-2"
              style={{ fontFamily: "Public Sans" }}
            >
              Your Publication
            </h2>
            {ownedPublications.length > 0 ? (
              <div className="w-full max-w-[819px] h-[143px] rounded-[4px] opacity-100 border border-[#EDEDED] p-[24px] bg-white mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full w-full gap-4 sm:gap-[88px]">
                  <div className="flex gap-6 items-center flex-1 min-w-0 w-full">
                    <Avatar className="w-[66px] h-[66px] opacity-100 border-[0.92px] border-[#EAEAEA] bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <AvatarImage
                        src={getPublicationLogoSrc(ownedPublications[0]?.logoUrl)}
                        alt="publication logo"
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-bold text-lg">
                        {ownedPublications[0]?.name?.charAt(0).toUpperCase() ||
                          "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full max-w-[414px]">
                      <div className="w-full h-auto opacity-100 flex flex-col gap-1">
                        <h3
                          className="font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] overflow-hidden text-ellipsis"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          {ownedPublications[0]?.name || "Publication Name"}
                        </h3>
                        <p
                          className="w-full opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#A4A4A4] line-clamp-2"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          {ownedPublications[0]?.description ||
                            "Note: Edit/Upload your logo, Favicon & Publication Description inside the publication settings. Start with clicking this Publication card"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Switch publication and navigate using router
                      switchPublication(ownedPublications[0]);
                      router.push(`/${ownedPublications[0].subdomain}/home`);
                    }}
                    className="flex-shrink-0 min-h-[26px] pt-[8px] pr-[4px] pb-[8px] pl-[4px] opacity-100 flex items-center justify-center w-full sm:w-auto"
                  >
                    <span
                      className="font-medium text-[14px] leading-[150%] tracking-[0%] inline-block bg-gradient-to-r from-[#A941FB] to-[rgba(120,100,240,0.92)] bg-clip-text text-transparent"
                      style={{
                        fontFamily: "Public Sans",
                      }}
                    >
                      Go to Publication
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A941FB]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[819px] h-[143px] rounded-[4px] opacity-100 border border-[#EDEDED] p-[24px] bg-white mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full w-full gap-4 sm:gap-[88px]">
                  <div className="flex gap-6 items-center flex-1 min-w-0 w-full">
                    <Avatar className="w-[66px] h-[66px] opacity-100 border-[0.92px] border-[#EAEAEA] bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <AvatarImage
                        src="/icons/nib.svg"
                        alt="publication"
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback className="w-full h-full bg-gray-100 text-gray-600 font-bold text-lg">
                        P
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full max-w-[414px]">
                      <div className="w-full h-auto opacity-100 flex flex-col gap-1">
                        <h3
                          className="font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] overflow-hidden text-ellipsis"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          No Publication Yet
                        </h3>
                        <p
                          className="w-full opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#A4A4A4] line-clamp-2"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          Create your first publication to get started.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/create-publication")}
                    className="flex-shrink-0 min-h-[26px] pt-[8px] pr-[4px] pb-[8px] pl-[4px] opacity-100 flex items-center justify-center w-full sm:w-auto"
                  >
                    <span
                      className="font-medium text-[14px] leading-[150%] tracking-[0%] inline-block bg-gradient-to-r from-[#A941FB] to-[rgba(120,100,240,0.92)] bg-clip-text text-transparent"
                      style={{
                        fontFamily: "Public Sans",
                      }}
                    >
                      Create Publication
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A941FB]" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Joined Publication Section */}
          <section>
            <h2
              className="w-auto h-[28px] opacity-100 font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] mb-2"
              style={{ fontFamily: "Public Sans" }}
            >
              Joined Publications
            </h2>
            {joinedPublications.length > 0 ? (
              <div className="space-y-4">
                {joinedPublications.map((joinedPub) => (
                  <div
                    key={joinedPub.id}
                    className="w-full max-w-[819px] h-[143px] rounded-[4px] opacity-100 border border-[#EDEDED] p-[24px] bg-white mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full w-full gap-4 sm:gap-[88px]">
                      <div className="flex gap-6 items-center flex-1 w-full">
                        <Avatar className="w-[66px] h-[66px] border-[0.92px] border-[#EAEAEA] bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <AvatarImage
                            src={getPublicationLogoSrc(joinedPub.logoUrl)}
                            alt={`${joinedPub.name} logo`}
                            className="w-full h-full object-cover"
                          />
                          <AvatarFallback className="w-full h-full bg-blue-100 text-blue-600 font-bold text-lg">
                            {joinedPub.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 w-full max-w-[414px]">
                          <div className="w-full h-auto opacity-100 flex flex-col gap-1">
                            <h3
                              className="font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] overflow-hidden text-ellipsis"
                              style={{ fontFamily: "Public Sans" }}
                            >
                              {joinedPub.name}
                            </h3>
                            <p
                              className="w-full opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#A4A4A4] line-clamp-2"
                              style={{ fontFamily: "Public Sans" }}
                            >
                              {joinedPub.description ||
                                "No description provided"}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span
                                className={`text-xs font-medium ${
                                  joinedPub.role === "editor"
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {joinedPub.role.charAt(0).toUpperCase() +
                                  joinedPub.role.slice(1)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {joinedPub.joinedAt
                                  ? `Joined ${new Date(
                                      joinedPub.joinedAt,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}`
                                  : "Joined Recently"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Switch publication and navigate using router
                          switchPublication(joinedPub);
                          router.push(`/${joinedPub.subdomain}/home`);
                        }}
                        className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <span
                          className="font-medium text-[14px] leading-[150%] tracking-[0%] inline-block bg-gradient-to-r from-[#A941FB] to-[rgba(120,100,240,0.92)] bg-clip-text text-transparent"
                          style={{
                            fontFamily: "Public Sans",
                          }}
                        >
                          Go to Publication
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#A941FB]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-[819px] h-[143px] rounded-[4px] opacity-100 border border-[#EDEDED] p-[24px] bg-white mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-[88px] h-full w-full">
                  <div className="flex gap-6 items-center flex-1 min-w-0 w-full">
                    <Avatar className="w-[66px] h-[66px] border-[0.92px] border-[#EAEAEA] opacity-100 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <AvatarImage
                        src="/icons/pen.svg"
                        alt="publication"
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback className="w-full h-full bg-gray-100 text-gray-600 font-bold text-lg">
                        P
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full max-w-[414px]">
                      <div className="w-full h-auto opacity-100 flex flex-col gap-1">
                        <h3
                          className="font-bold text-[16px] leading-[28px] tracking-[0%] text-[#000000] overflow-hidden text-ellipsis"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          Publication Name
                        </h3>
                        <p
                          className="w-full opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#A4A4A4] line-clamp-2"
                          style={{ fontFamily: "Public Sans" }}
                        >
                          Note: Edit/Upload your logo, Favicon & Publication
                          Description inside the publication settings. Start
                          with clicking this Publication card
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Implement join publication flow (e.g., show modal with invite code input)
                      console.log("Join publication clicked");
                    }}
                    className="flex-shrink-0 min-h-[26px] pt-[8px] pr-[4px] pb-[8px] pl-[4px] gap-[4px] opacity-100 flex items-center justify-center w-full sm:w-auto"
                  >
                    <span
                      className="font-medium text-[14px] leading-[150%] tracking-[0%] inline-block bg-gradient-to-r from-[#A941FB] to-[rgba(120,100,240,0.92)] bg-clip-text text-transparent"
                      style={{
                        fontFamily: "Public Sans",
                      }}
                    >
                      Join Publication
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A941FB]" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
