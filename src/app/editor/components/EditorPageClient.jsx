"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryDropdown } from "./CategoryDropdown"
import { ThumbnailModal } from "./ThumbnailModal"
import { DateTimePicker } from "./DateTimePicker"
import { useArticles } from "@/contexts/ArticlesContext"
import { useSession } from "@/lib/auth-client"

import { 
  Image as ImageIcon,
  Calendar,
  ChevronLeft,
  FileText,
} from "lucide-react"

import { TiptapEditor } from "./TiptapEditor"

export default function EditorPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { createArticle, updateArticle, uploadArticleImage } = useArticles()
  
  // Get status and ID from URL parameters
  const articleStatus = searchParams.get('status')
  const articleId = searchParams.get('id')
  
  // State management
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [editorContent, setEditorContent] = useState('')
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false)
  const [thumbnailImage, setThumbnailImage] = useState(null)
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentArticleId, setCurrentArticleId] = useState(articleId ? parseInt(articleId) : null)

  const handleEditorUpdate = ({ html, charCount: chars, wordCount: words }) => {
    setEditorContent(html)
    setCharCount(chars)
    setWordCount(words)
  }

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !editorContent.trim()) {
      alert('Please fill in title, description, and content before publishing.')
      return
    }

    try {
      setIsLoading(true)
      
      if (currentArticleId) {
        // Update existing article and publish
        await updateArticle(currentArticleId, {
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: true
        })
      } else {
        // Create new article and publish
        const newArticle = await createArticle({
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: true
        })
        setCurrentArticleId(newArticle.id)
        
        // Upload thumbnail if provided and it's a File object
        if (thumbnailImage && thumbnailImage.file instanceof File) {
          try {
            await uploadArticleImage(newArticle.id, thumbnailImage.file)
          } catch (imageError) {
            console.error('Error uploading thumbnail:', imageError)
            // Don't fail the entire publish process for image upload errors
            alert(`Article published successfully, but thumbnail upload failed: ${imageError.message}`)
          }
        }
      }
      
      // Redirect to published page
      router.push('/published')
    } catch (error) {
      console.error('Error publishing article:', error)
      alert('Failed to publish article. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!title.trim() || !description.trim() || !editorContent.trim()) {
      alert('Please fill in title, description, and content before scheduling.')
      return
    }

    if (!publishDate || !publishTime) {
      alert('Please select a date and time for scheduling.')
      return
    }

    try {
      setIsLoading(true)
      
      // For now, we'll save as draft and handle scheduling logic later
      if (currentArticleId) {
        await updateArticle(currentArticleId, {
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: false
        })
      } else {
        const newArticle = await createArticle({
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: false
        })
        setCurrentArticleId(newArticle.id)
        
        if (thumbnailImage && thumbnailImage.file instanceof File) {
          try {
            await uploadArticleImage(newArticle.id, thumbnailImage.file)
          } catch (imageError) {
            console.error('Error uploading thumbnail:', imageError)
            alert(`Article scheduled successfully, but thumbnail upload failed: ${imageError.message}`)
          }
        }
      }
      
      console.log("Scheduled for:", publishDate, publishTime)
      router.push('/draft')
    } catch (error) {
      console.error('Error scheduling article:', error)
      alert('Failed to schedule article. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!currentArticleId) {
      alert('No article to update.')
      return
    }

    if (!title.trim() || !description.trim() || !editorContent.trim()) {
      alert('Please fill in title, description, and content.')
      return
    }

    try {
      setIsLoading(true)
      
      await updateArticle(currentArticleId, {
        title,
        description,
        content: editorContent,
        categories: selectedCategories,
        published: articleStatus === 'published'
      })
      
      if (thumbnailImage && thumbnailImage.file instanceof File) {
        try {
          await uploadArticleImage(currentArticleId, thumbnailImage.file)
        } catch (imageError) {
          console.error('Error uploading thumbnail:', imageError)
          alert(`Article updated successfully, but thumbnail upload failed: ${imageError.message}`)
        }
      }
      
      alert('Article updated successfully!')
    } catch (error) {
      console.error('Error updating article:', error)
      alert('Failed to update article. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!title.trim() || !description.trim() || !editorContent.trim()) {
      alert('Please fill in title, description, and content before saving.')
      return
    }

    try {
      setIsLoading(true)
      
      if (currentArticleId) {
        await updateArticle(currentArticleId, {
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: false
        })
      } else {
        const newArticle = await createArticle({
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: false
        })
        setCurrentArticleId(newArticle.id)
        
        if (thumbnailImage && thumbnailImage.file instanceof File) {
          try {
            await uploadArticleImage(newArticle.id, thumbnailImage.file)
          } catch (imageError) {
            console.error('Error uploading thumbnail:', imageError)
            alert(`Draft saved successfully, but thumbnail upload failed: ${imageError.message}`)
          }
        }
      }
      
      router.push('/draft')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevertToDraft = async () => {
    if (!currentArticleId) return

    try {
      setIsLoading(true)
      await updateArticle(currentArticleId, {
        title,
        description,
        content: editorContent,
        categories: selectedCategories,
        published: false
      })
      router.push('/draft')
    } catch (error) {
      console.error('Error reverting to draft:', error)
      alert('Failed to revert to draft. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReschedule = () => {
    setIsDateTimePickerOpen(true)
  }

  const handleThumbnailAdd = (imageData) => {
    setThumbnailImage(imageData)
  }

  const handleDateTimeSelect = (date, time) => {
    setPublishDate(date)
    setPublishTime(time)
  }

  // Status badge configuration
  const getStatusConfig = () => {
    switch (articleStatus) {
      case 'published':
        return { color: 'bg-green-400', text: 'Published' }
      case 'scheduled':
        return { color: 'bg-blue-400', text: 'Scheduled' }
      case 'trash':
        return { color: 'bg-red-400', text: 'Trash' }
      case 'review':
        return { color: 'bg-orange-400', text: 'Draft' }
      case 'draft':
      default:
        return { color: 'bg-orange-400', text: 'Drafts' }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col">
      {/* Go Back Button */}
      <div className="px-4 md:px-6 pt-6 pb-4 border-b border-gray-200 md:bg-transparent md:border-0">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/home')}
          className="text-gray-500 hover:text-gray-700 px-2 gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Main Editor Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-32">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200">
          <div className={`w-2 h-2 ${statusConfig.color} rounded-full`}></div>
          <span className="text-gray-500 text-sm">{statusConfig.text}</span>
        </div>

        {/* Title */}
        <div>
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl md:text-5xl font-bold border-0 px-0 py-2 bg-transparent placeholder:text-gray-300 focus-visible:ring-0 shadow-none"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
          />
        </div>

        {/* Description */}
        <div>
          <Input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-lg text-gray-600 border-0 px-0 py-2 bg-transparent placeholder:text-gray-300 focus-visible:ring-0 shadow-none"
          />
        </div>

        {/* Categories and Thumbnail */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <CategoryDropdown
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
          />

          <Button
            onClick={() => setIsThumbnailModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {thumbnailImage ? 'Change' : 'Thumbnail'}
            </span>
          </Button>

          <div className="ml-auto flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Saved</span>
          </div>
        </div>

        {/* Tiptap Editor */}
        <TiptapEditor 
          onUpdate={handleEditorUpdate}
          initialContent=""
          onImageModalToggle={setIsImageModalOpen}
        />
      </div>

      {/* Character/Word Count and Publish Controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#fff] border-t border-gray-200 ${(isThumbnailModalOpen || isImageModalOpen) ? 'hidden' : ''}`} style={{zIndex:999}}>
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-4">
          {/* Character/Word Count */}
          <div className="flex justify-end">
            <div className="text-sm text-gray-400">
              <span>Chars <span className="text-gray-600">{charCount}</span></span>
              <span className="mx-2">|</span>
              <span>Words <span className="text-gray-600">{wordCount}</span></span>
            </div>
          </div>

          {/* Publish Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3">
            {/* Mobile Layout */}
            <div className="flex md:hidden items-center gap-2 w-full">
              {articleStatus === 'trash' ? (
                <Button 
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Reverting...' : 'Revert to draft'}
                </Button>
              ) : articleStatus === 'review' ? (
                <Button 
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Publishing...' : 'Send for Review'}
                </Button>
              ) : articleStatus === 'published' ? (
                <Button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                  </Button>
                  <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      placeholder="--:--"
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleReschedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                  >
                    {isLoading ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    {isLoading ? 'Publishing...' : 'Publish'}
                  </Button>
                  <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      placeholder="--:--"
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleSchedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                  >
                    {isLoading ? 'Scheduling...' : 'Schedule'}
                  </button>
                  <Button 
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                </>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-center gap-3">
              {articleStatus === 'trash' ? (
                <Button 
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-6 rounded-lg"
                >
                  {isLoading ? 'Reverting...' : 'Revert to draft'}
                </Button>
              ) : articleStatus === 'review' ? (
                <Button 
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                >
                  {isLoading ? 'Publishing...' : 'Send for Review'}
                  <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                </Button>
              ) : articleStatus === 'published' ? (
                <Button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                  <img src="/editor-icons/publish.svg" alt="Update" className="h-4 w-4" />
                </Button>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 border border-gray-200 rounded-l-lg">
                      <Input
                        type="text"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="w-24 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      />
                      <Input
                        type="text"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        placeholder="--:--"
                        className="w-16 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                      />
                      <button
                        onClick={() => setIsDateTimePickerOpen(true)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Calendar className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                    <button 
                      onClick={handleReschedule}
                      disabled={isLoading}
                      className="bg-gray-200 text-gray-400 text-sm font-medium px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200"
                    >
                      {isLoading ? 'Rescheduling...' : 'Reschedule'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 border border-gray-200 rounded-l-lg">
                      <Input
                        type="text"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="w-24 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      />
                      <Input
                        type="text"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        placeholder="--:--"
                        className="w-16 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                      />
                      <button
                        onClick={() => setIsDateTimePickerOpen(true)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Calendar className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSchedule}
                      disabled={isLoading}
                      className="bg-gray-200 text-gray-400 text-sm font-medium px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200"
                    >
                      {isLoading ? 'Scheduling...' : 'Schedule'}
                    </button>
                  </div>
                  <Button 
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 gap-2 px-6 rounded-lg"
                  >
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                    <FileText className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Modal */}
      <ThumbnailModal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        onImageAdd={handleThumbnailAdd}
      />

      {/* Date Time Picker */}
      <DateTimePicker
        isOpen={isDateTimePickerOpen}
        onClose={() => setIsDateTimePickerOpen(false)}
        onDateTimeSelect={handleDateTimeSelect}
        selectedDate={publishDate}
        selectedTime={publishTime}
      />
    </div>
  )
}