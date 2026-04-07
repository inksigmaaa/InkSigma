import FeatureItem from "@/components/common/FeatureItem"
import { FEATURES_DATA } from "@/constants/features"

export default function FeaturesSection() {
  const leftColumn = FEATURES_DATA.slice(0, 3)
  const rightColumn = FEATURES_DATA.slice(3)

  return (
    <section id="features" className="py-16 px-3 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="w-auto md:w-[207px] h-auto md:h-12 mx-auto mb-12 md:mb-16 flex items-center justify-center text-center text-[32px] md:text-[48px] font-[800] leading-[100%] tracking-[0%] text-[#2E2E2E]" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          Features
        </h2>

        <div className="flex flex-col md:flex-row gap-x-24 justify-center items-center">
          <div className="flex-1 max-w-md space-y-12 mb-5 md:mb-0">
            {leftColumn.map((feature) => (
              <FeatureItem
                key={feature.id}
                title={feature.title}
                subtitle={feature.subtitle}
                icon={feature.icon}
                details={feature.details}
              />
            ))}
          </div>

          <div className="flex-1 max-w-md space-y-12">
            {rightColumn.map((feature) => (
              <FeatureItem
                key={feature.id}
                title={feature.title}
                subtitle={feature.subtitle}
                icon={feature.icon}
                details={feature.details}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}