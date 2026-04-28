"use client"

import { useEffect, useState } from "react"
import { Bell, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import { toast } from "sonner"

export default function DashboardNavbar() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const user = session?.user
  const [localUserData, setLocalUserData] = useState(null)

  // Listen for profile updates from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'profileUpdated') {
        refetch()
        router.refresh()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refetch, router])

  // Check for locally stored fresh user data
  useEffect(() => {
    const checkLocalUserData = () => {
      const stored = localStorage.getItem('freshUserData')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setLocalUserData(parsed)
        } catch (e) {
          console.error("Error parsing freshUserData:", e)
        }
      }
    }
    checkLocalUserData()
  }, [session])

  // Merge session user with locally stored fresh user data
  const mergedUser = user ? {
    ...user,
    ...(localUserData && {
      name: localUserData.profileName || user.name,
      image: localUserData.image || user.image,
    })
  } : null

  const handleSignOut = async () => {
    try {
      await signOut()
      localStorage.clear()
      sessionStorage.clear()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed. Please try again.")
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const userName = mergedUser?.name || user?.name || "User"
  const userEmail = user?.email || "user@example.com"
  const userAvatar = mergedUser?.image || user?.image || user?.avatar || user?.picture
  return (
    <nav className="border-b bg-white sticky top-0 z-50 mt-6">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/icons/inksigma-logo.svg" alt="InkSigma" className="h-6 md:h-8" />
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notification Bell */}
          <button className="relative rounded-full p-1.5 md:p-2 hover:bg-gray-100 transition-colors">
            <Bell className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 md:gap-2 rounded-lg hover:bg-gray-100 p-1 md:p-2 transition-colors focus:outline-none">
              <Avatar className="h-8 w-8 md:h-9 md:w-9">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs md:text-sm">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs md:text-sm font-medium text-gray-700">
                {isPending ? "Loading..." : userName}
              </span>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
