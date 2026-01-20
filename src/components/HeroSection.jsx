import { Button } from "@/components/ui/button"
import { HERO_CONFIG } from "@/constants/app"
import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  return (
    <section 
      className="relative flex items-center justify-center bg-no-repeat bg-cover pt-20"
      style={{
        backgroundImage: 'url(/images/background/bg.svg)',
        height: '600px',
        backgroundPosition: 'right'
      }}
    >
      <div className="w-[642px] h-[169px] absolute top-[331px] left-[639px] gap-4 opacity-100 text-center">
        <h1 className="mb-6">
          <span className="font-[family-name:var(--font-allison)] text-[96px] font-normal text-black">{HERO_CONFIG.title.italic}</span>
          <span className="text-[48px] font-extrabold leading-[68px] text-text-primary" style={{ wordSpacing: '12px' }}>
            {HERO_CONFIG.title.bold}
          </span>
        </h1>
        
        <div className="w-[531px] h-[57px] text-text-primary font-light text-base leading-none tracking-normal text-center flex items-center justify-center mb-8 mx-auto">
          Welcome to the home of writers - pen down your innermost musings, ideas, stories, and inspire others to grow through words that connect. Write daily, inspire & be heard
        </div>
        
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