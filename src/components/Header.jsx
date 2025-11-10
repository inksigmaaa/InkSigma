"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useScrollToSection } from "@/hooks/useScrollToSection"
import { MAIN_NAVIGATION, LOGOS } from "@/constants"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollToFeatures = useScrollToSection('features')
  const scrollToRoadmap = useScrollToSection('roadmap')

  const handleNavClick = (item) => {
    if (item.type === 'scroll') {
      const sectionId = item.href.replace('#', '')
      if (sectionId === 'features') scrollToFeatures()
      if (sectionId === 'roadmap') scrollToRoadmap()
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="w-full bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Mobile Menu Button - Left Side */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={LOGOS.main}
            alt="Sigma Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {MAIN_NAVIGATION.map((item) => (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuLink asChild>
                  {item.type === 'link' ? (
                    <Link 
                      href={item.href}
                      className="inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleNavClick(item)}
                      className="inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  )}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Login Button */}
        <Link href="/login">
          <Button 
            variant="default" 
            className="bg-black text-white hover:bg-gray-800"
          >
            Login
          </Button>
        </Link>
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
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            
            <div className="w-10"></div>
          </div>
          
          <nav className="flex flex-col items-center justify-start h-[calc(100vh-80px)] space-y-12 mt-10">
            {MAIN_NAVIGATION.map((item) => (
              <div key={item.id}>
                {item.type === 'link' ? (
                  <Link 
                    href={item.href}
                    className="block text-2xl font-medium text-gray-700 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleNavClick(item)}
                    className="text-2xl font-medium text-gray-700 hover:text-gray-900"
                  >
                    {item.label}
                  </button>
                )}
              </div>
            ))}
            
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant="default" 
                className="bg-black text-white hover:bg-gray-800 px-12 py-6 text-lg rounded-lg"
              >
                Login
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}