import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { CTA_CONFIG } from "@/constants/app"

export default function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-3">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            {CTA_CONFIG.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {CTA_CONFIG.description}
          </p>
          <Button 
            size="lg"
            className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-8 py-3 text-base font-medium rounded-full shadow-sm"
          >
            {CTA_CONFIG.buttonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}