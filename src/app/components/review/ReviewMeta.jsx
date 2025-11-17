import { Clock } from "lucide-react"

export default function ReviewMeta({ date }) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <Clock className="h-4 w-4" />
      <span>{date}</span>
    </div>
  )
}