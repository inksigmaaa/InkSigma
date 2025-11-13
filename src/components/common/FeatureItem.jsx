import Image from "next/image"

/**
 * Reusable feature item component
 * @param {Object} props - Component props
 * @param {string} props.title - Feature title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {string} props.icon - Icon path
 * @param {string[]} [props.details] - Optional list of feature details
 */
export default function FeatureItem({ title, subtitle, icon, details }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 mt-1">
        <Image
          src={icon}
          alt="Feature check"
          width={24}
          height={24}
          className="w-6 h-6"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-gray-600">{subtitle}</p>
        )}
        {details && details.length > 0 && (
          <ul className="space-y-2 ml-4 mt-3">
            {details.map((detail, index) => (
              <li key={index} className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}