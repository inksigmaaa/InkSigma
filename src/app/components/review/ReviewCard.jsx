import DesktopReviewLayout from "./DesktopReviewLayout"
import MobileReviewLayout from "./MobileReviewLayout"

export default function ReviewCard({ 
  article, 
  isSelected, 
  onSelectionChange, 
  onRevertToDraft 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <DesktopReviewLayout 
        article={article}
        isSelected={isSelected}
        onSelectionChange={onSelectionChange}
        onRevertToDraft={onRevertToDraft}
      />
      
      <MobileReviewLayout article={article} />
    </div>
  )
}