import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ScheduleHeader({ category, onCategoryChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
        <h1 className="text-base font-bold text-gray-800">Scheduled</h1>
      </div>

      {/* Category Select - Mobile */}
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[140px] md:hidden">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sports">Sports</SelectItem>
          <SelectItem value="humour">Humour</SelectItem>
          <SelectItem value="history">History</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}