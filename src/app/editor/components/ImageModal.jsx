import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Image as ImageIcon } from "lucide-react"

export function ImageModal({ 
  show, 
  onClose, 
  imagePreview, 
  imageTitle, 
  setImageTitle,
  imageAlt,
  setImageAlt,
  onImageUpload,
  onAddImage,
  imageInputRef,
  title = "Upload Image",
  sizeHint = "Upload Image here"
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6">
          <div
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto" />
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-500">{sizeHint}</p>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {title === "Upload Image" ? "Title text" : "Image Title"} {title === "Upload Image" && <span className="text-gray-400">(optional)</span>}
            </label>
            <Input
              type="text"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder={title === "Upload Image" ? "Enter Title Text" : "Enter your Image Title"}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt {title === "Upload Image" ? "title" : "text"} {title === "Upload Image" && <span className="text-gray-400">(optional)</span>}
            </label>
            <Input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder={title === "Upload Image" ? "Enter Alt Description" : "Enter alt Text"}
              className="w-full"
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={onAddImage}
              disabled={!imagePreview}
              className="flex-1 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Add image
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
