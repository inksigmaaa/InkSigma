import DesktopReviewLayout from "./DesktopReviewLayout"
import MobileReviewLayout from "./MobileReviewLayout"
import { useRouter } from 'next/navigation'
import { usePublication } from "@/contexts/PublicationContext"
import { withPublicationPath } from "@/utils/dashboardUrl"
import { useArticleStore } from "@/stores/articleStore"

export default function ReviewCard({ 
  article, 
  isSelected, 
  onSelectionChange, 
  onRevertToDraft 
}) {
  const router = useRouter()
  const { currentPublication } = usePublication()
  const prefetchArticle = useArticleStore((s) => s.prefetchArticle)

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons, checkboxes, or other interactive elements
    if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('[role="checkbox"]')) {
      return
    }
    prefetchArticle(article.id, article).catch(() => {})
    router.push(
      withPublicationPath(
        `/editor?status=review&id=${article.id}`,
        currentPublication,
      ),
    )
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
