import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LinkModal({
  show,
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  linkNewTab,
  setLinkNewTab,
  linkNoFollow,
  setLinkNoFollow,
  onInsert,
}) {
  if (!show) return null

  return (
    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg p-6 shadow-lg z-20 w-[400px]">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
          <Input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="http://"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Text</label>
          <Input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Link text"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={linkNewTab}
              onChange={(e) => setLinkNewTab(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Open in new tab</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={linkNoFollow}
              onChange={(e) => setLinkNoFollow(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">No follow</span>
          </label>
        </div>

        <Button 
          onClick={onInsert}
          className="w-full bg-black text-white hover:bg-gray-800"
        >
          Insert
        </Button>
      </div>
    </div>
  )
}
