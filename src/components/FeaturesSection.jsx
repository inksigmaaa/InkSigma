import FeatureItem from "@/components/common/FeatureItem"
import { FEATURES_DATA } from "@/constants/features"

export default function FeaturesSection() {
  const leftColumnFeatures = FEATURES_DATA.slice(0, Math.ceil(FEATURES_DATA.length / 2))
  const rightColumnFeatures = FEATURES_DATA.slice(Math.ceil(FEATURES_DATA.length / 2))

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Features
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-20 max-w-6xl mx-auto">
          <div className="space-y-8">
            {leftColumnFeatures.map((feature) => (
              <FeatureItem
                key={feature.id}
                title={feature.title}
                subtitle={feature.subtitle}
                icon={feature.icon}
                details={feature.details}
              />
            ))}
          </div>
          <div className="space-y-8">
            {rightColumnFeatures.map((feature) => (
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