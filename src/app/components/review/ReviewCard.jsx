import DesktopReviewLayout from "./DesktopReviewLayout"
import MobileReviewLayout from "./MobileReviewLayout"
import { useRouter } from 'next/navigation'

export default function ReviewCard({ 
  article, 
  isSelected, 
  onSelectionChange, 
  onRevertToDraft 
}) {
  const router = useRouter()

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons, checkboxes, or other interactive elements
    if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('[role="checkbox"]')) {
      return
    }
    router.push(`/editor?status=review&id=${article.id}`)
  }

  return (
    <div 
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleCardClick}
    >
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