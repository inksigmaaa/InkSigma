"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

const menuItems = [
  {
    title: "My Space",
    icon: "/icons/my-space.svg",
    href: "/dashboard",
  },
  {
    title: "Settings",
    icon: "/icons/settings.svg",
    href: "/dashboard/settings",
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 bg-white border-r md:min-h-screen border-b md:border-b-0">
      <nav className="p-2 md:p-4 flex md:flex-col md:space-y-2 gap-2 md:gap-0 overflow-x-auto md:overflow-x-visible">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors whitespace-nowrap",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <img src={item.icon} alt={item.title} className="h-4 w-4 md:h-5 md:w-5" />
              <span className="font-medium text-sm md:text-base">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
