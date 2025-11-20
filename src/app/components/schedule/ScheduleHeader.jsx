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
        <SelectTrigger 
          className="flex items-center justify-between bg-white border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:hidden whitespace-nowrap"
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