"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useScrollToSection } from "@/hooks/useScrollToSection"
import { MAIN_NAVIGATION, LOGOS } from "@/constants"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollToHome = useScrollToSection('home')
  const scrollToFeatures = useScrollToSection('features')
  const scrollToRoadmap = useScrollToSection('roadmap')

  const handleNavClick = (item) => {
    if (item.type === 'scroll') {
      const sectionId = item.href.replace('#', '')
      if (sectionId === 'home') scrollToHome()
      if (sectionId === 'features') scrollToFeatures()
      if (sectionId === 'roadmap') scrollToRoadmap()
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-[1920px] h-[84px] mx-auto z-50 pt-6 pb-6 border-b border-gray-200 opacity-100 overflow-hidden max-md:h-16 max-md:pt-0 max-md:pb-0 max-md:flex max-md:items-center" style={{ background: '#FEFEFE' }}>
      <div className="w-full flex items-center justify-between max-w-[1920px] mx-auto px-[151.63px] max-md:px-5 relative">
        {/* Mobile Menu Button - Left Side */}
        <button
          className="md:hidden p-2 z-10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo - Left on desktop, Center on mobile */}
        <Link href="/" className="flex items-center max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2">
          {/* Desktop logo with border */}
          <Image
            src={LOGOS.main}
            alt="Sigma Logo"
            width={109.74}
            height={36.16}
            className="w-[109.74px] h-[36.16px] hidden md:block"
          />
          {/* Mobile logo without border */}
          <Image
            src={LOGOS.mobile}
            alt="Sigma Logo"
            width={76.79}
            height={24.80}
            className="w-[76.79px] h-[24.80px] md:hidden"
          />
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-[72px]">
            {MAIN_NAVIGATION.map((item) => {
              // Define specific dimensions for each nav item
              const getItemStyle = (itemId) => {
                switch (itemId) {
                  case 'home':
                    return { width: '39px', height: '21px', opacity: 1 };
                  case 'features':
                    return { width: '51px', height: '21px', opacity: 1 };
                  case 'roadmap':
                    return { width: '62px', height: '21px', opacity: 1 };
                  default:
                    return { height: '21px', opacity: 1 };
                }
              };

              return (
                <div key={item.id} className="flex items-center justify-center" style={getItemStyle(item.id)}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className="flex items-center justify-center h-full cursor-pointer text-text-primary hover:opacity-80 transition-opacity"
                    style={{
                      fontFamily: 'Public Sans, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '150%',
                      letterSpacing: '0%'
                    }}
                  >
                    {item.label}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Login Button - Right positioned */}
        <a href="http://dashboard.inksigma.local:3000/login" className="flex items-center">
          <Button
            style={{
              width: '85px',
              height: '32px',
              opacity: 1,
              paddingTop: '8px',
              paddingRight: '24px',
              paddingBottom: '8px',
              paddingLeft: '24px',
              gap: '10px',
              borderRadius: '4px',
              background: '#080808',
              animationDuration: '0ms',
              border: 'none'
            }}
            className="text-white hover:bg-gray-800 transition-none duration-0 text-sm font-medium border-0 max-md:w-[70px] max-md:h-[28px] max-md:text-xs max-md:px-3"
          >
            Login
          </Button>
        </a>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src={LOGOS.main}
                alt="Sigma Logo"
                width={109.74}
                height={36.16}
                className="w-[109.74px] h-[36.16px]"
              />
            </Link>

            <div className="w-10"></div>
          </div>

          <nav className="flex flex-col items-center justify-start h-[calc(100vh-80px)] space-y-12 mt-10">
            {MAIN_NAVIGATION.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleNavClick(item)}
                  className="text-2xl font-medium text-text-primary hover:opacity-80"
                >
                  {item.label}
                </button>
              </div>
            ))}

            <a href="http://dashboard.inksigma.local:3000/login" onClick={() => setMobileMenuOpen(false)}>
              <Button
                style={{
                  width: '85px',
                  height: '32px',
                  opacity: 1,
                  paddingTop: '8px',
                  paddingRight: '24px',
                  paddingBottom: '8px',
                  paddingLeft: '24px',
                  gap: '10px',
                  borderRadius: '4px',
                  background: '#080808',
                  animationDuration: '0ms',
                  border: 'none'
                }}
                className="text-white hover:bg-gray-800 transition-none duration-0 text-sm font-medium border-0"
              >
                Login
              </Button>
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}