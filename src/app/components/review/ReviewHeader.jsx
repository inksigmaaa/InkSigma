import { Checkbox } from "@/components/ui/checkbox"

export default function ReviewHeader({ article, isSelected, onSelectionChange }) {
  return (
    <div className="flex items-start gap-4 flex-1">
      <Checkbox 
        checked={isSelected}
        onCheckedChange={onSelectionChange}
        className="mt-1"
      />
      
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {article.title}
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          {article.author}
        </p>
        
        <div className="flex gap-2 flex-wrap">
          {article.tags.map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}