"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Image as ImageIcon,
  Calendar,
  ChevronLeft,
} from "lucide-react"

import { ImageModal } from "./components/ImageModal"
import { LinkModal } from "./components/LinkModal"
import { EditorToolbar } from "./components/EditorToolbar"
import { useEditorState } from "./hooks/useEditorState"
import { useEditorFormat } from "./hooks/useEditorFormat"
import { useDropdowns } from "./hooks/useDropdowns"
import { useLinkInsertion } from "./hooks/useLinkInsertion"
import { useImageUpload } from "./hooks/useImageUpload"

export default function EditorPage() {
  const router = useRouter()
  
  // Custom hooks
  const editorState = useEditorState()
  const { applyFormat, applyHeading, applyFontFamily } = useEditorFormat(editorState.editorRef)
  const dropdowns = useDropdowns()
  const linkInsertion = useLinkInsertion()
  const contentImage = useImageUpload()
  const thumbnailImage = useImageUpload()

  const [showImageTooltip, setShowImageTooltip] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [contenteditable]:empty:before {
        content: attr(data-placeholder);
        color: #d1d5db;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const handlePublish = () => {
    const content = editorState.editorRef.current?.innerHTML || ""
    console.log("Publishing:", { 
      title: editorState.title, 
      description: editorState.description, 
      content, 
      category: editorState.category, 
      publishDate: editorState.publishDate, 
      publishTime: editorState.publishTime 
    })
  }

  const handleSchedule = () => {
    const content = editorState.editorRef.current?.innerHTML || ""
    console.log("Scheduling:", { 
      title: editorState.title, 
      description: editorState.description, 
      content, 
      category: editorState.category, 
      publishDate: editorState.publishDate, 
      publishTime: editorState.publishTime 
    })
  }

  const handleSaveDraft = () => {
    const content = editorState.editorRef.current?.innerHTML || ""
    console.log("Saving draft:", { 
      title: editorState.title, 
      description: editorState.description, 
      content, 
      category: editorState.category 
    })
  }

  const insertImage = () => {
    dropdowns.closeAllDropdowns()
    contentImage.setShowImageModal(true)
  }

  const insertLink = () => {
    dropdowns.closeAllDropdowns()
    linkInsertion.setShowLinkModal(true)
  }

  return (
    <>
      {/* Thumbnail Upload Modal */}
      <ImageModal
        show={thumbnailImage.showImageModal}
        onClose={thumbnailImage.resetImageState}
        imagePreview={thumbnailImage.imagePreview}
        imageTitle={thumbnailImage.imageTitle}
        setImageTitle={thumbnailImage.setImageTitle}
        imageAlt={thumbnailImage.imageAlt}
        setImageAlt={thumbnailImage.setImageAlt}
        onImageUpload={thumbnailImage.handleImageUpload}
        onAddImage={thumbnailImage.handleAddImage}
        imageInputRef={thumbnailImage.imageInputRef}
        title="Thumbnail Image"
        sizeHint="Image Size: 1200px*630px"
      />

      {/* Content Image Upload Modal */}
      <ImageModal
        show={contentImage.showImageModal}
        onClose={contentImage.resetImageState}
        imagePreview={contentImage.imagePreview}
        imageTitle={contentImage.imageTitle}
        setImageTitle={contentImage.setImageTitle}
        imageAlt={contentImage.imageAlt}
        setImageAlt={contentImage.setImageAlt}
        onImageUpload={contentImage.handleImageUpload}
        onAddImage={contentImage.handleAddImage}
        imageInputRef={contentImage.imageInputRef}
      />

      <div className="min-h-screen bg-[#fafafa]">
        {/* Go Back Button - Full Width on Mobile/Tablet */}
        <div className="px-4 md:px-6 pt-6 pb-4 border-b border-gray-200 bg-white md:bg-transparent md:border-0">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/schedule')}
            className="text-gray-500 hover:text-gray-700 px-2 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Main Editor Container */}
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-gray-500 text-sm">Drafts</span>
            </div>

            {/* Title */}
            <div>
              <Input
                type="text"
                placeholder="Title of the Blog..."
                value={editorState.title}
                onChange={(e) => editorState.setTitle(e.target.value)}
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
                value={editorState.description}
                onChange={(e) => editorState.setDescription(e.target.value)}
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
              <Select value={editorState.category} onValueChange={editorState.setCategory}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="gap-2 bg-white" 
                onClick={() => thumbnailImage.setShowImageModal(true)}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Thumbnail Image</span>
                <span className="sm:hidden">Thumbnail</span>
              </Button>

              <div className="ml-auto flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Saved</span>
              </div>
            </div>

            {/* Toolbar */}
            <EditorToolbar
              font={editorState.font}
              applyFontFamily={(font) => {
                editorState.setFont(font)
                applyFontFamily(font)
              }}
              applyHeading={applyHeading}
              applyFormat={applyFormat}
              showHeadingMenu={dropdowns.showHeadingMenu}
              setShowHeadingMenu={dropdowns.setShowHeadingMenu}
              showListMenu={dropdowns.showListMenu}
              setShowListMenu={dropdowns.setShowListMenu}
              showAlignMenu={dropdowns.showAlignMenu}
              setShowAlignMenu={dropdowns.setShowAlignMenu}
              showAdvancedOptions={dropdowns.showAdvancedOptions}
              setShowAdvancedOptions={dropdowns.setShowAdvancedOptions}
              showImageTooltip={showImageTooltip}
              setShowImageTooltip={setShowImageTooltip}
              onInsertImage={insertImage}
              onInsertLink={insertLink}
              closeAllDropdowns={dropdowns.closeAllDropdowns}
            />

            {/* Link Modal */}
            <div className="relative dropdown-container">
              <LinkModal
                show={linkInsertion.showLinkModal}
                linkUrl={linkInsertion.linkUrl}
                setLinkUrl={linkInsertion.setLinkUrl}
                linkText={linkInsertion.linkText}
                setLinkText={linkInsertion.setLinkText}
                linkNewTab={linkInsertion.linkNewTab}
                setLinkNewTab={linkInsertion.setLinkNewTab}
                linkNoFollow={linkInsertion.linkNoFollow}
                setLinkNoFollow={linkInsertion.setLinkNoFollow}
                onInsert={linkInsertion.handleInsertLink}
              />
            </div>

            {/* Editor Area */}
            <div 
              ref={editorState.editorRef}
              contentEditable
              onInput={editorState.updateCounts}
              className="min-h-[300px] md:min-h-[400px] w-full border-0 focus:outline-none text-gray-700 prose max-w-none bg-transparent text-base md:text-lg"
              data-placeholder="Start writing..."
              style={{
                fontFamily: editorState.font
              }}
            />

            {/* Character/Word Count and Publish Controls */}
            <div className="space-y-4 pt-6">
              {/* Character/Word Count - Right Aligned */}
              <div className="flex justify-end">
                <div className="text-sm text-gray-400">
                  <span>Chars <span className="text-gray-600">{editorState.charCount}</span></span>
                  <span className="mx-2">|</span>
                  <span>Words <span className="text-gray-600">{editorState.wordCount}</span></span>
                </div>
              </div>

              {/* Publish Controls - Centered on Desktop, Stacked on Mobile/Tablet */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3">
                <Button 
                  onClick={handlePublish}
                  className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg w-full md:w-auto"
                >
                  Publish Now
                  <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                </Button>

                {/* Schedule Group */}
                <div className="flex items-center gap-0 rounded-lg overflow-hidden w-full md:w-auto">
                  {/* White background section */}
                  <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2.5 border border-gray-200 rounded-l-lg flex-1 md:flex-initial">
                    <Input
                      type="text"
                      value={editorState.publishDate}
                      onChange={(e) => editorState.setPublishDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-[100px] md:w-[130px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <Input
                      type="text"
                      value={editorState.publishTime}
                      onChange={(e) => editorState.setPublishTime(e.target.value)}
                      placeholder="--:--"
                      className="w-[50px] md:w-[60px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                    <Calendar className="h-5 w-5 text-gray-700" />
                  </div>
                  
                  {/* Gray background button */}
                  <button 
                    onClick={handleSchedule}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 md:px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </>
  )
}
