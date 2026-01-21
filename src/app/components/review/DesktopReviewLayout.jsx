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
    <div className="hidden md:flex items-start justify-between gap-6">
      <ReviewHeader 
        article={article}
        isSelected={isSelected}
        onSelectionChange={onSelectionChange}
      />

      {/* Right side - Avatar, Button and Date */}
      <div className="flex flex-col items-end gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <ReviewActions onRevertToDraft={onRevertToDraft} />
          
        </div>
        <ReviewMeta date={article.date} />
      </div>
    </div>
  )
}