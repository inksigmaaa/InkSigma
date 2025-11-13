import Image from "next/image"
import Link from "next/link"

/**
 * Reusable social media icon component
 * @param {Object} props - Component props
 * @param {string} props.href - Link URL
 * @param {string} props.icon - Icon path
 * @param {string} props.label - Accessibility label
 */
export default function SocialIcon({ href, icon, label }) {
  return (
    <Link 
      href={href} 
      className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
      aria-label={label}
    >
      <Image
        src={icon}
        alt={label}
        width={16}
        height={16}
        className="invert"
      />
    </Link>
  )
}