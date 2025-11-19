import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"

export default function ScheduleControls({ 
  selectedPosts, 
  totalPosts, 
  onSelectAll, 
  category, 
  onCategoryChange 
}) {
  return (
    <div className="hidden md:flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedPosts.length === totalPosts}
            onCheckedChange={onSelectAll}
            className="peer-checked:bg-violet-600 peer-checked:border-violet-600"
          />
          <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
            Select all
          </label>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`${selectedPosts.length === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
          disabled={selectedPosts.length === 0}
        >
          <Image src="/svg/delete.svg" alt="Delete" width={20} height={20} />
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