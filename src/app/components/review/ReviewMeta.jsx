import { Clock } from "lucide-react"

export default function ReviewMeta({ date }) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-xs">
      <Clock className="h-3 w-3" />
      <span>{date}</span>
    </div>
  )
}