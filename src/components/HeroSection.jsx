import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { HERO_CONFIG } from "@/constants/app"

export default function HeroSection() {
  return (
    <section 
      className="relative min-h-[600px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${HERO_CONFIG.backgroundImage}')`
      }}
    >
      <div className="absolute inset-0 bg-white/70"></div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6">
          <span className="italic font-serif">{HERO_CONFIG.title.italic}</span>{" "}
          <span className="font-bold">{HERO_CONFIG.title.bold}</span>
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