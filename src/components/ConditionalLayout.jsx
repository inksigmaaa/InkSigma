"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password"
  const isDashboardPage = pathname?.startsWith("/dashboard")

  if (isAuthPage || isDashboardPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}