import ReviewHeader from "./ReviewHeader"
import ReviewActions from "./ReviewActions"
import ReviewMeta from "./ReviewMeta"

export default function DesktopReviewLayout({ 
  article, 
  isSelected, 
  onSelectionChange, 
  onRevertToDraft 
}) {
  return (
    <div className="hidden md:flex items-start justify-between">
      <ReviewHeader 
        article={article}
        isSelected={isSelected}
        onSelectionChange={onSelectionChange}
      />

      {/* Right side - Button and Date */}
      <div className="flex flex-col items-end gap-8 ml-6">
        <ReviewActions onRevertToDraft={onRevertToDraft} />
        <ReviewMeta date={article.date} />
      </div>
    </div>
  )
}