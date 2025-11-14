import FeatureItem from "@/components/common/FeatureItem"
import { FEATURES_DATA } from "@/constants/features"

export default function FeaturesSection() {
  const leftColumn = FEATURES_DATA.slice(0, 3)
  const rightColumn = FEATURES_DATA.slice(3)

  return (
    <section className="py-16 px-3 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-bold text-center text-gray-900 mb-16">
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