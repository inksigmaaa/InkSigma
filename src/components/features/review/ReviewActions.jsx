import { Button } from "@/components/ui/button"

export default function ReviewActions({ onRevertToDraft }) {
  return (
    <Button 
      variant="outline"
      className="text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
      onClick={onRevertToDraft}
    >
      Revert to Draft
    </Button>
  )
}