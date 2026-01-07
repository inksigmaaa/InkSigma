"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryDropdown } from "./CategoryDropdown"
import { ThumbnailModal } from "./ThumbnailModal"
import { DateTimePicker } from "./DateTimePicker"
import PublishSuccessModal from "./PublishSuccessModal"
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
  const { createArticle, updateArticle, uploadArticleImage, getArticleById } = useArticles()
  
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoadingArticle, setIsLoadingArticle] = useState(false)
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false)
  const [publishedBlogSlug, setPublishedBlogSlug] = useState('')
  
  // Refs to track latest values for auto-save
  const titleRef = useRef(title)
  const descriptionRef = useRef(description)
  const editorContentRef = useRef(editorContent)
  const selectedCategoriesRef = useRef(selectedCategories)
  const currentArticleIdRef = useRef(currentArticleId)
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const isSavingRef = useRef(false)

  // Load existing article data if ID is provided
  useEffect(() => {
    const loadArticle = async () => {
      if (articleId && session?.user?.id) {
        try {
          setIsLoadingArticle(true)
          const article = await getArticleById(parseInt(articleId))
          
          // Populate form with existing article data
          setTitle(article.title || '')
          setDescription(article.description || '')
          setSelectedCategories(article.categories || [])
          setEditorContent(article.content || '')
          setCurrentArticleId(article.id)
          
          // Reset unsaved changes since we just loaded
          setHasUnsavedChanges(false)
          setIsSaved(true)
        } catch (error) {
          console.error('Error loading article:', error)
          alert('Failed to load article. Please try again.')
          router.push('/home')
        } finally {
          setIsLoadingArticle(false)
        }
      }
    }

    loadArticle()
  }, [articleId, session?.user?.id, getArticleById, router])

  // Update refs when state changes
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { descriptionRef.current = description }, [description])
  useEffect(() => { editorContentRef.current = editorContent }, [editorContent])
  useEffect(() => { selectedCategoriesRef.current = selectedCategories }, [selectedCategories])
  useEffect(() => { currentArticleIdRef.current = currentArticleId }, [currentArticleId])
  useEffect(() => { hasUnsavedChangesRef.current = hasUnsavedChanges }, [hasUnsavedChanges])

  // Track unsaved changes
  useEffect(() => {
    if (title || description || editorContent) {
      setHasUnsavedChanges(true)
      setIsSaved(false)
    }
  }, [title, description, editorContent, selectedCategories])

  // Auto-save to draft function
  const autoSaveToDraft = useCallback(async () => {
    // Don't save if already saving, no content, or no unsaved changes
    if (isSavingRef.current) return
    if (!titleRef.current.trim() && !descriptionRef.current.trim() && !editorContentRef.current.trim()) return
    if (!hasUnsavedChangesRef.current) return
    
    // Need at least a title to save
    if (!titleRef.current.trim()) return

    try {
      isSavingRef.current = true
      
      if (currentArticleIdRef.current) {
        // Update existing article
        await updateArticle(currentArticleIdRef.current, {
          title: titleRef.current,
          description: descriptionRef.current,
          content: editorContentRef.current,
          categories: selectedCategoriesRef.current,
          status: 'draft'
        })
      } else {
        // Create new draft article
        const newArticle = await createArticle({
          title: titleRef.current,
          description: descriptionRef.current || 'Draft',
          content: editorContentRef.current || '<p></p>',
          categories: selectedCategoriesRef.current,
          status: 'draft'
        })
        currentArticleIdRef.current = newArticle.id
        setCurrentArticleId(newArticle.id)
      }
      
      setHasUnsavedChanges(false)
      setIsSaved(true)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      isSavingRef.current = false
    }
  }, [createArticle, updateArticle])

  // Auto-save on beforeunload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current && titleRef.current.trim()) {
        // Try to save (may not complete due to async nature)
        autoSaveToDraft()
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [autoSaveToDraft])

  // Auto-save periodically (every 30 seconds) if there are unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChangesRef.current && titleRef.current.trim()) {
        autoSaveToDraft()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [autoSaveToDraft])

  // Save to draft when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current && titleRef.current.trim()) {
        // Use synchronous approach for unmount
        const saveData = {
          title: titleRef.current,
          description: descriptionRef.current || 'Draft',
          content: editorContentRef.current || '<p></p>',
          categories: selectedCategoriesRef.current,
          articleId: currentArticleIdRef.current
        }
        
        // Store in sessionStorage for recovery if async save fails
        sessionStorage.setItem('unsavedDraft', JSON.stringify(saveData))
        
        // Attempt async save
        autoSaveToDraft()
      }
    }
  }, [autoSaveToDraft])

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
      let publishedBlog = null
      
      if (currentArticleId) {
        // Update existing article and publish
        publishedBlog = await updateArticle(currentArticleId, {
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: true
        })
      } else {
        // Create new article and publish
        publishedBlog = await createArticle({
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          published: true
        })  
        setCurrentArticleId(publishedBlog.id)
        
        // Upload thumbnail if provided and it's a File object
        if (thumbnailImage && thumbnailImage.file instanceof File) {
          try {
            await uploadArticleImage(publishedBlog.id, thumbnailImage.file)
          } catch (imageError) {
            console.error('Error uploading thumbnail:', imageError)
            // Don't fail the entire publish process for image upload errors
            alert(`Article published successfully, but thumbnail upload failed: ${imageError.message}`)
          }
        }
      }
      
      setHasUnsavedChanges(false)
      setIsSaved(true)
      
      // Set blog slug for the modal and show success modal
      setPublishedBlogSlug(publishedBlog?.slug || 'blog')
      setShowPublishSuccessModal(true)
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
      
      // Parse the date and time correctly
      const [day, month, year] = publishDate.split('-').map(num => parseInt(num, 10))
      const [hours, minutes] = publishTime.split(':').map(num => parseInt(num, 10))
      
      // Create date object in UTC to avoid timezone conversion issues
      const scheduledDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes))
      
      // Validate the date
      if (isNaN(scheduledDateTime.getTime())) {
        alert('Invalid date or time format. Please check your input.')
        return
      }
      
      // Check if the scheduled time is in the future (compare in UTC)
      const now = new Date()
      if (scheduledDateTime <= now) {
        alert('Scheduled time must be in the future.')
        return
      }
      
      
      if (currentArticleId) {
        await updateArticle(currentArticleId, {
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          status: 'scheduled',
          scheduledAt: scheduledDateTime.toISOString()
        })
      } else {
        const newArticle = await createArticle({
          title,
          description,
          content: editorContent,
          categories: selectedCategories,
          status: 'scheduled',
          scheduledAt: scheduledDateTime.toISOString()
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
      
      setHasUnsavedChanges(false)
      setIsSaved(true)
      console.log("Successfully scheduled for:", scheduledDateTime.toISOString())
      router.push('/schedule')
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
      
      setHasUnsavedChanges(false)
      setIsSaved(true)
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
      
      setHasUnsavedChanges(false)
      setIsSaved(true)
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
      setHasUnsavedChanges(false)
      setIsSaved(true)
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

  // Input validation functions
  const handleDateChange = (e) => {
    const value = e.target.value
    // Allow only numbers and dashes, format: dd-mm-yyyy
    const dateRegex = /^(\d{0,2})-?(\d{0,2})-?(\d{0,4})$/
    if (dateRegex.test(value) || value === '') {
      setPublishDate(value)
    }
  }

  const handleTimeChange = (e) => {
    const value = e.target.value
    // Allow only numbers and colons, format: hh:mm
    const timeRegex = /^(\d{0,2}):?(\d{0,2})$/
    if (timeRegex.test(value) || value === '') {
      setPublishTime(value)
    }
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
      <style jsx>{`
        input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
      `}</style>
      
      {/* Loading state for article */}
      {isLoadingArticle && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
      )}
      
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
            {isSaved ? (
              <>
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Saved</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-600">Unsaved</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-400">No changes</span>
              </>
            )}
          </div>
        </div>

        {/* Tiptap Editor */}
        <TiptapEditor 
          onUpdate={handleEditorUpdate}
          initialContent={editorContent}
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
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
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
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
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
            <div className="hidden md:flex items-center justify-center gap-2">
              {articleStatus === 'trash' ? (
                <button 
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Reverting...' : 'Revert to draft'}
                </button>
              ) : articleStatus === 'review' ? (
                <button 
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 flex items-center gap-2 px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Publishing...' : 'Send for Review'}
                  <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                </button>
              ) : articleStatus === 'published' ? (
                <button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 flex justify-center items-center gap-2 px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                  <img src="/editor-icons/publish.svg" alt="Update" className="h-4 w-4" />
                </button>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    <FileText className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save to draft'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </button>
                  <div className="flex items-center bg-white px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 h-8" style={{ width: '200px' }}>
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 p-0"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center p-0"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleReschedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium h-8 rounded"
                    style={{ width: '80px', padding: '8px 5px' }}
                  >
                    {isLoading ? 'Rescheduling...' : 'Schedule'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    <FileText className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save to draft'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    {isLoading ? 'Publishing...' : 'Publish'}
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </button>
                  <div className="flex items-center bg-white px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 h-8" style={{ width: '200px' }}>
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 p-0"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center p-0"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleSchedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium h-8 rounded"
                    style={{ width: '80px', padding: '8px 5px' }}
                  >
                    {isLoading ? 'Scheduling...' : 'Schedule'}
                  </button>
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

      {/* Publish Success Modal */}
      <PublishSuccessModal
        isOpen={showPublishSuccessModal}
        onClose={() => setShowPublishSuccessModal(false)}
        blogSlug={publishedBlogSlug}
        blogTitle={title}
      />
    </div>
  )
}
