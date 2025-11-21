import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"

export default function ScheduleControls({ 
  selectedPosts, 
  totalPosts, 
  onSelectAll, 
  category, 
  onCategoryChange 
}) {
  return (
    <div className="hidden sm:flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 p-2 bg-gray-100">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedPosts.length === totalPosts && totalPosts > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-white bg-white checked:bg-violet-600 checked:border-violet-600 focus:outline-none focus:ring-0"
            style={{
              accentColor: '#7c3aed'
            }}
          />
          <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
            Select all
          </label>
        </div>
        <button
          title="Delete selected"
          disabled={selectedPosts.length === 0}
          className={`w-8 h-8 border rounded flex items-center justify-center transition ${
            selectedPosts.length > 0
              ? "bg-white border-gray-300 cursor-pointer hover:bg-gray-50"
              : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
          }`}
        >
          <Trash2 className={`h-4 w-4 ${selectedPosts.length === 0 ? "text-gray-300" : "text-gray-600"}`} />
        </button>
      </div>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px] text-gray-600">
          <SelectValue placeholder="Choose Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sports">Sports</SelectItem>
          <SelectItem value="humour">Humour</SelectItem>
          <SelectItem value="history">History</SelectItem>
          <SelectItem value="technology">Technology</SelectItem>
          <SelectItem value="business">Business</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}