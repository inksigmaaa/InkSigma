import CategoryFilter from "../categoryFilter/CategoryFilter"

export default function ScheduleHeader({ category, onCategoryChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h1 className="text-lg font-semibold text-gray-900">Scheduled</h1>
      </div>

      {/* Category Select - Mobile Only */}
      <div className="sm:hidden">
        <CategoryFilter 
          selectedCategories={category ? [category] : []}
          onCategoriesChange={(cats) => onCategoryChange(cats[0] || "")}
          buttonText="Category"
        />
      </div>
    </div>
  )
}