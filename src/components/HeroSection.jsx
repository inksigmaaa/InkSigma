import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { HERO_CONFIG } from "@/constants/app"

export default function HeroSection() {
  return (
    <section 
      className="relative flex items-center justify-center bg-no-repeat bg-cover"
      style={{
        backgroundImage: 'url(/images/background/bg.svg)',
        height: '600px',
        backgroundPosition: 'right'
      }}
    >
      <div className="relative z-10 text-center px-3 max-w-4xl mx-auto">
        <h1 className="mb-6">
          <span className="font-[family-name:var(--font-allison)] text-[96px] font-normal text-black">{HERO_CONFIG.title.italic}</span>
          <span className="text-[48px] font-extrabold leading-[68px]" style={{ color: '#2E2E2E', wordSpacing: '12px' }}>{HERO_CONFIG.title.bold}</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {HERO_CONFIG.subtitle}
        </p>
        
        <Button 
          size="lg"
          className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-8 py-3 text-base font-medium rounded-full"
        >
          {HERO_CONFIG.ctaText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}