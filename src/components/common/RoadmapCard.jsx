import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

/**
 * Reusable roadmap card component
 * @param {Object} props - Component props
 * @param {string} props.version - Version number (e.g., "V1", "V2")
 * @param {string} props.title - Card title
 * @param {string} props.status - Status: 'completed' or 'upcoming'
 * @param {string} [props.description] - Optional description
 * @param {string} [props.icon] - Optional icon path
 * @param {string} [props.buttonText] - Optional button text
 * @param {string[]} [props.features] - Optional list of features
 */
export default function RoadmapCard({ 
  version, 
  title, 
  status, 
  description, 
  icon, 
  buttonText, 
  features = [] 
}) {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="flex items-center mb-6">
        <h3 className="text-4xl font-light text-gray-300 mr-4">{version}</h3>
        <div className="flex items-center">
          <span className={`text-lg font-semibold mr-2 ${
            status === 'completed' ? 'text-gray-900' : 'text-gray-600'
          }`}>
            {title}
          </span>
          {icon && (
            <Image
              src={icon}
              alt="Status icon"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-gray-600 mb-6">
          {description}
        </p>
      )}
      
      {features.length > 0 && (
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-600">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
              {feature}
            </li>
          ))}
        </ul>
      )}
      
      {buttonText && (
        <Button 
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-6 mt-6"
        >
          {buttonText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}