"use client"

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
import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function DashboardNavbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleProfileSettings = () => {
    router.push("/profile-settings")
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
  return (
    <nav className="border-b bg-white sticky top-0 z-50 mt-6 shadow-md">
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
                <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs md:text-sm">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs md:text-sm font-medium text-gray-700">
                {session?.user?.name || "User"}
              </span>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileSettings}>Profile Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-black" onClick={handleSignOut}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
