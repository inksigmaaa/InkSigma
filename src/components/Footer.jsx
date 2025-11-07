import Image from "next/image"
import Link from "next/link"
import SocialIcon from "@/components/common/SocialIcon"
import { APP_CONFIG, LOGOS, FOOTER_LINKS, SOCIAL_LINKS } from "@/constants"

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image
                src={LOGOS.main}
                alt="Sigma Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-sm max-w-xs">
              {APP_CONFIG.description}
            </p>
            <div className="flex space-x-3">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon
                  key={social.id}
                  href={social.href}
                  icon={social.icon}
                  label={social.label}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <Link 
              href={`mailto:${APP_CONFIG.email}`}
              className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
            >
              {APP_CONFIG.email}
            </Link>
          </div>
        </div>
        <div className="border-t mt-12 pt-8">
          <p className="text-center text-gray-500 text-sm">
            {APP_CONFIG.copyright.split('Zemuria')[0]}
            <Link href="#" className="text-blue-600 hover:text-blue-800">
              {APP_CONFIG.company.split(' ')[0]}
            </Link>
            {' Inc. brand.'}
          </p>
        </div>
      </div>
    </footer>
  )
}