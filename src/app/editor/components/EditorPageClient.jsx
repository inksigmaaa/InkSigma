"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryDropdown } from "./CategoryDropdown"
import { ThumbnailModal } from "./ThumbnailModal"
import { DateTimePicker } from "./DateTimePicker"

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
  
  // Get status from URL parameters
  const articleStatus = searchParams.get('status')
  
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

  const handleEditorUpdate = ({ html, charCount: chars, wordCount: words }) => {
    setEditorContent(html)
    setCharCount(chars)
    setWordCount(words)
  }

  const handlePublish = () => {
    console.log("Publishing:", { 
      title, 
      description, 
      content: editorContent, 
      categories: selectedCategories, 
      publishDate, 
      publishTime 
    })
  }

  const handleSchedule = () => {
    console.log("Scheduling:", { 
      title, 
      description, 
      content: editorContent, 
      categories: selectedCategories, 
      publishDate, 
      publishTime 
    })
  }

  const handleUpdate = () => {
    console.log("Updating:", { 
      title, 
      description, 
      content: editorContent, 
      categories: selectedCategories, 
      publishDate, 
      publishTime 
    })
  }

  const handleRevertToDraft = () => {
    console.log("Reverting to draft:", { 
      title, 
      description, 
      content: editorContent, 
      categories: selectedCategories 
    })
  }

  const handleReschedule = () => {
    console.log("Rescheduling:", { 
      title, 
      description, 
      content: editorContent, 
      categories: selectedCategories, 
      publishDate, 
      publishTime 
    })
  }

  const handleThumbnailAdd = (imageData) => {
    setThumbnailImage(imageData)
    console.log("Thumbnail added:", imageData)
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
      case 'draft':
      default:
        return { color: 'bg-orange-400', text: 'Drafts' }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col">
      {/* Go Back Button - Full Width on Mobile/Tablet */}
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

      {/* Main Editor Container - Flex grow to take available space */}
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
            placeholder="Title of the Blog..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl md:text-4xl font-bold border-0 px-0 focus-visible:ring-0 focus:outline-none placeholder:text-gray-300 bg-transparent outline-none shadow-none"
            style={{ 
              border: 'none', 
              outline: 'none', 
              boxShadow: 'none' 
            }}
          />
        </div>

        {/* Description */}
        <div>
          <Input
            type="text"
            placeholder="Write your Short Description for your Blog..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-base text-gray-400 border-0 px-0 focus-visible:ring-0 focus:outline-none placeholder:text-gray-300 bg-transparent outline-none shadow-none"
            style={{ 
              border: 'none', 
              outline: 'none', 
              boxShadow: 'none' 
            }}
          />
        </div>

        {/* Category and Thumbnail */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 py-4 border-y border-gray-200">
          <CategoryDropdown 
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
          />

          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            onClick={() => setIsThumbnailModalOpen(true)}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {thumbnailImage ? 'Change Thumbnail' : 'Thumbnail Image'}
            </span>
            <span className="sm:hidden">
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

      {/* Character/Word Count and Publish Controls - Fixed at bottom */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#fff] border-t border-gray-200 ${(isThumbnailModalOpen || isImageModalOpen) ? 'hidden' : ''}`} style={{zIndex:999}}>
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-4">
          {/* Character/Word Count - Right Aligned */}
          <div className="flex justify-end">
            <div className="text-sm text-gray-400">
              <span>Chars <span className="text-gray-600">{charCount}</span></span>
              <span className="mx-2">|</span>
              <span>Words <span className="text-gray-600">{wordCount}</span></span>
            </div>
          </div>

          {/* Publish Controls - Mobile: Single row, Desktop: Centered */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3">
            {/* Mobile Layout - Single Row */}
            <div className="flex md:hidden items-center gap-2 w-full">
              {articleStatus === 'trash' ? (
                <>
                  {/* Revert to Draft Button */}
                  <Button 
                    onClick={handleRevertToDraft}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                  >
                    Revert to draft
                  </Button>
                </>
              ) : articleStatus === 'published' ? (
                <>
                  {/* Update Button */}
                  <Button 
                    onClick={handleUpdate}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Update
                  </Button>

                  {/* Revert to Draft Button */}
                  <Button 
                    onClick={handleRevertToDraft}
                    variant="outline"
                    className="bg-gray-100 text-gray-500 hover:bg-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium gap-2 flex-1"
                  >
                    <FileText className="h-4 w-4" />
                    Revert to Draft
                  </Button>
                </>
              ) : articleStatus === 'scheduled' ? (
                <>
                  {/* Publish Now Button */}
                  <Button 
                    onClick={handlePublish}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Publish Now
                  </Button>

                  {/* Date/Time/Calendar Group - White Container */}
                  <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      placeholder="--:--"
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Reschedule Button */}
                  <button 
                    onClick={handleReschedule}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                  >
                    Reschedule
                  </button>
                </>
              ) : (
                <>
                  {/* Publish Button */}
                  <Button 
                    onClick={handlePublish}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Publish
                  </Button>

                  {/* Date/Time/Calendar Group - White Container */}
                  <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      placeholder="--:--"
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Schedule Button */}
                  <button 
                    onClick={handleSchedule}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                  >
                    Schedule
                  </button>
                </>
              )}
            </div>

            {/* Desktop Layout - Original Design */}
            <div className="hidden md:flex items-center justify-center gap-3">
              {articleStatus === 'trash' ? (
                <>
                  {/* Revert to Draft Button */}
                  <Button 
                    onClick={handleRevertToDraft}
                    className="bg-black text-white hover:bg-gray-800 px-6 rounded-lg"
                  >
                    Revert to draft
                  </Button>
                </>
              ) : articleStatus === 'published' ? (
                <>
                  {/* Update Button */}
                  <Button 
                    onClick={handleUpdate}
                    className="bg-black text-white hover:bg-gray-800 px-6 rounded-lg"
                  >
                    Update
                  </Button>

                  {/* Revert to Draft Button */}
                  <Button 
                    onClick={handleRevertToDraft}
                    variant="outline"
                    className="bg-gray-100 text-gray-500 hover:bg-gray-200 px-6 rounded-lg gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Revert to Draft
                  </Button>
                </>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <Button 
                    onClick={handlePublish}
                    className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                  >
                    Publish Now
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </Button>

                  {/* Reschedule Group */}
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                    {/* White background section */}
                    <div className="flex items-center gap-3 bg-white px-4 border border-gray-200 rounded-l-lg">
                      <Input
                        type="text"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="w-[130px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                      <Input
                        type="text"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        placeholder="--:--"
                        className="w-[60px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                      <button
                        onClick={() => setIsDateTimePickerOpen(true)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Calendar className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                    
                    {/* Gray background button */}
                    <button 
                      onClick={handleReschedule}
                      className="bg-gray-200 text-gray-400 text-sm font-medium px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200"
                    >
                      Reschedule
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handlePublish}
                    className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg"
                  >
                    Publish Now
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </Button>

                  {/* Schedule Group */}
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden">
                    {/* White background section */}
                    <div className="flex items-center gap-3 bg-white px-4 border border-gray-200 rounded-l-lg">
                      <Input
                        type="text"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="w-[130px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                      <Input
                        type="text"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        placeholder="--:--"
                        className="w-[60px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                      <button
                        onClick={() => setIsDateTimePickerOpen(true)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Calendar className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                    
                    {/* Gray background button */}
                    <button 
                      onClick={handleSchedule}
                      className="bg-gray-200 text-gray-400 text-sm font-medium px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200"
                    >
                      Schedule
                    </button>
                  </div>
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