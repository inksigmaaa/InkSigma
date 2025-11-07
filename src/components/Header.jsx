"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useScrollToSection } from "@/hooks/useScrollToSection"
import { MAIN_NAVIGATION, LOGOS } from "@/constants"

export default function Header() {
  const scrollToFeatures = useScrollToSection('features')
  const scrollToRoadmap = useScrollToSection('roadmap')

  const handleNavClick = (item) => {
    if (item.type === 'scroll') {
      const sectionId = item.href.replace('#', '')
      if (sectionId === 'features') scrollToFeatures()
      if (sectionId === 'roadmap') scrollToRoadmap()
    }
  }

  return (
    <header className="w-full bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src={LOGOS.main}
            alt="Sigma Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
        <NavigationMenu>
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
        <Link href="/login">
          <Button 
            variant="default" 
            className="bg-black text-white hover:bg-gray-800"
          >
            Login
          </Button>
        </Link>
      </div>
    </header>
  )
}