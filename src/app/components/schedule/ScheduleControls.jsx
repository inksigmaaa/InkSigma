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
          <input
            type="checkbox"
            id="select-all"
            checked={selectedPosts.length === totalPosts}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="cursor-pointer accent-violet-600"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              borderWidth: '1px',
              opacity: 1
            }}
          />
          <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
            Select all
          </label>
        </div>
        <button
          title="Delete"
          disabled={selectedPosts.length === 0}
          className={`w-8 h-8 border rounded-lg p-2 flex items-center justify-center transition ${
            selectedPosts.length > 0
              ? "bg-white border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
              : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
          }`}
        >
          <Image src="/svg/delete.svg" alt="Delete" width={20} height={20} className={selectedPosts.length === 0 ? "opacity-50" : ""} />
        </button>
      </div>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger 
          className="flex items-center justify-between bg-white border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
          style={{
            minWidth: '163px',
            height: '32px',
            borderRadius: '4px',
            borderWidth: '1px',
            opacity: 1,
            gap: '10px',
            padding: '6px 16px',
            fontFamily: 'Public Sans',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '150%',
            letterSpacing: '0%',
            color: '#6B7280'
          }}
        >
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