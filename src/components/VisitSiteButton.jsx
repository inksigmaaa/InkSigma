export default function VisitSiteButton() {
  return (
    <a 
      href="/" 
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 bg-purple-600 text-white px-7 py-3 rounded-lg font-['Public_Sans'] font-semibold text-sm no-underline shadow-[0_4px_12px_rgba(139,92,246,0.3)] z-[100] hidden md:hidden hover:bg-purple-700 hover:shadow-[0_6px_16px_rgba(139,92,246,0.4)] transition-all duration-300 max-[768px]:block"
      title="Visit site"
    >
      Visit site
    </a>
  )
}
