import { Button } from "@/components/ui/button"
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
    <div className="hidden md:flex items-center justify-between">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer w-[123px] h-10 bg-[#F8F8F8] rounded px-3 py-4">
          <input
            type="checkbox"
            checked={selectedPosts.length === totalPosts && totalPosts > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-[18px] h-[18px] cursor-pointer accent-purple-600"
          />
          <span className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">Select all</span>
        </label>
        <Button 
          variant="ghost" 
          size="icon" 
          title="Delete"
          className={`${selectedPosts.length === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
          disabled={selectedPosts.length === 0}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[200px] border-gray-300">
          <SelectValue placeholder="Choose Category" />
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