import RoadmapCard from "@/components/common/RoadmapCard"
import { ROADMAP_DATA } from "@/constants/roadmap"

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Roadmap
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {ROADMAP_DATA.map((roadmapItem) => (
            <RoadmapCard
              key={roadmapItem.id}
              version={roadmapItem.version}
              title={roadmapItem.title}
              status={roadmapItem.status}
              description={roadmapItem.description}
              icon={roadmapItem.icon}
              buttonText={roadmapItem.buttonText}
              features={roadmapItem.features}
            />
          ))}
        </div>
      </div>
    </section>
  )
}