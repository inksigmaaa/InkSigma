import CategoryFilter from "../categoryFilter/CategoryFilter"
import { Trash2 } from "lucide-react"

export default function ScheduleControls({ 
  selectedPosts, 
  totalPosts, 
  onSelectAll, 
  category, 
  onCategoryChange,
  onBulkDraft,
  onBulkDelete
}) {
  return (
    <div className="hidden sm:flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer w-[123px] h-8 bg-[#F8F8F8] rounded px-3 py-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedPosts.length === totalPosts && totalPosts > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-white bg-white checked:bg-violet-600 checked:border-violet-600 focus:outline-none focus:ring-0"
            style={{
              accentColor: '#3400A3'
            }}
          />
          <label htmlFor="select-all" className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">
            Select all
          </label>
        </div>
        <button
          title="Move to Draft"
          disabled={selectedPosts.length === 0}
          onClick={onBulkDraft}
          className={`w-8 h-8 border rounded flex items-center justify-center transition ${
            selectedPosts.length > 0
              ? "bg-white border-gray-300 cursor-pointer hover:bg-gray-50"
              : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
          }`}
        >
          <img src="/images/icons/draft1.svg" alt="Move to Draft" className={`w-4 h-4 ${selectedPosts.length === 0 ? "opacity-50" : ""}`} />
        </button>
        <button
          title="Delete selected"
          disabled={selectedPosts.length === 0}
          onClick={onBulkDelete}
          className={`w-8 h-8 border rounded flex items-center justify-center transition ${
            selectedPosts.length > 0
              ? "bg-white border-gray-300 cursor-pointer hover:bg-gray-50"
              : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
          }`}
        >
          <Trash2 className={`h-4 w-4 ${selectedPosts.length === 0 ? "text-gray-300" : "text-gray-600"}`} />
        </button>
      </div>

      <CategoryFilter 
        selectedCategories={category ? [category] : []}
        onCategoriesChange={(cats) => onCategoryChange(cats[0] || "")}
        buttonText="Choose Category"
      />
    </div>
  )
}