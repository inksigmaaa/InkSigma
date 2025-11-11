"use client"

import { useState, useRef, useEffect } from "react"
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
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  Image as ImageIcon,
  Code,
  Quote,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
  ChevronLeft,
  Save
} from "lucide-react"


export default function EditorPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [font, setFont] = useState("Roboto")
  const [heading, setHeading] = useState("P")
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [publishDate, setPublishDate] = useState("")
  const [publishTime, setPublishTime] = useState("")
  const [showListMenu, setShowListMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showImageTooltip, setShowImageTooltip] = useState(false)
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const editorRef = useRef(null)

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

  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || ""
      setCharCount(text.length)
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    }
  }

  const applyFormat = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const applyHeading = (tag) => {
    setHeading(tag)
    if (tag === "P") {
      applyFormat("formatBlock", "<p>")
    } else {
      applyFormat("formatBlock", `<${tag}>`)
    }
  }

  const applyFontFamily = (fontName) => {
    setFont(fontName)
    applyFormat("fontName", fontName)
  }

  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      applyFormat("createLink", url)
    }
  }

  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      applyFormat("insertImage", url)
    }
  }

  const handlePublish = () => {
    const content = editorRef.current?.innerHTML || ""
    console.log("Publishing:", { title, description, content, category, publishDate, publishTime })
  }

  const handleSchedule = () => {
    const content = editorRef.current?.innerHTML || ""
    console.log("Scheduling:", { title, description, content, category, publishDate, publishTime })
  }

  const handleSaveDraft = () => {
    const content = editorRef.current?.innerHTML || ""
    console.log("Saving draft:", { title, description, content, category })
  }

  return (
    <>
      <div className="min-h-screen bg-[#fafafa]">
        <div className="flex">
          {/* Go Back Button - Left Side */}
          <div className="pt-6 pl-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 px-2 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Main Editor Container */}
          <div className="flex-1 max-w-5xl mx-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-gray-500 text-sm">Drafts</span>
            </div>

        {/* Title */}
        <div>
          <Input
            type="text"
            placeholder="Title of the Blog..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl font-bold border-0 px-0 focus-visible:ring-0 focus:outline-none placeholder:text-gray-300 bg-transparent outline-none shadow-none"
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
        <div className="flex items-center gap-4 py-4 border-b border-gray-200">
          <Select value={category} onValueChange={setCategory}>
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

          <Button variant="outline" className="gap-2 bg-white">
            <ImageIcon className="h-4 w-4" />
            Thumbnail Image
          </Button>

          <div className="ml-auto flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Saved</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 py-3 border-b border-gray-200">
          {/* Font Selector */}
          <div className="relative flex items-center gap-1.5">
            <span className="text-base font-normal text-gray-700">{font}</span>
            <div className="flex flex-col -space-y-1">
              <button
                onClick={() => {
                  const fonts = ["Arial", "Arial Black", "Brush Script MT", "Comic Sans MS", "Courier New", "Garamond", "Georgia", "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode", "Palatino Linotype", "Roboto", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"]
                  const currentIndex = fonts.indexOf(font)
                  const nextIndex = currentIndex > 0 ? currentIndex - 1 : fonts.length - 1
                  applyFontFamily(fonts[nextIndex])
                }}
                className="hover:bg-gray-100 rounded p-0.5"
              >
                <ChevronUp className="h-3 w-3 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  const fonts = ["Arial", "Arial Black", "Brush Script MT", "Comic Sans MS", "Courier New", "Garamond", "Georgia", "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode", "Palatino Linotype", "Roboto", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"]
                  const currentIndex = fonts.indexOf(font)
                  const nextIndex = currentIndex < fonts.length - 1 ? currentIndex + 1 : 0
                  applyFontFamily(fonts[nextIndex])
                }}
                className="hover:bg-gray-100 rounded p-0.5"
              >
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Heading Selector */}
          <div className="flex items-center gap-2">
            <img src="/editor-icons/P.svg" alt="P" />
            <div className="relative">
              <button
                className="flex items-center hover:bg-gray-100 rounded px-1"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setShowHeadingMenu(!showHeadingMenu)
                }}
              >
                <img src="/editor-icons/H.svg" alt="H" />
                <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
              </button>
              {showHeadingMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[80px]">
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H1')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H1
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H2')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H2
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H3')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H3
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H4')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H4
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H5')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H5
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyHeading('H6')
                      setShowHeadingMenu(false)
                    }}
                  >
                    H6
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Format Buttons */}
          <button
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Bold"
          >
            <img src="/editor-icons/B.svg" alt="Bold" />
          </button>
          <button
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Italic"
          >
            <img src="/editor-icons/italic.svg" alt="Italic" />
          </button>
          <button
            onClick={() => applyFormat('underline')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Underline"
          >
            <img src="/editor-icons/underline.svg" alt="Underline" />
          </button>
          <button
            onClick={() => applyFormat('strikeThrough')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Strikethrough"
          >
            <img src="/editor-icons/strike.svg" alt="Strikethrough" />
          </button>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* List Button with Dropdown */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
              onMouseDown={(e) => {
                e.preventDefault()
                setShowListMenu(!showListMenu)
              }}
              title="Lists"
            >
              <img src="/editor-icons/list.svg" alt="Lists" />
              <ChevronDown className="h-3 w-3 text-gray-700" />
            </button>
            {showListMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[150px]">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('insertUnorderedList')
                    setShowListMenu(false)
                  }}
                >
                  <List className="h-4 w-4" />
                  Bullet List
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('insertOrderedList')
                    setShowListMenu(false)
                  }}
                >
                  <ListOrdered className="h-4 w-4" />
                  Numbered List
                </button>
              </div>
            )}
          </div>

          {/* Align Button with Dropdown */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
              onMouseDown={(e) => {
                e.preventDefault()
                setShowAlignMenu(!showAlignMenu)
              }}
              title="Alignment"
            >
              <img src="/editor-icons/Paragraph.svg" alt="Alignment" />
              <ChevronDown className="h-3 w-3 text-gray-700" />
            </button>
            {showAlignMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[150px]">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('justifyLeft')
                    setShowAlignMenu(false)
                  }}
                >
                  <AlignLeft className="h-4 w-4" />
                  Align Left
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('justifyCenter')
                    setShowAlignMenu(false)
                  }}
                >
                  <AlignCenter className="h-4 w-4" />
                  Align Center
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('justifyRight')
                    setShowAlignMenu(false)
                  }}
                >
                  <AlignRight className="h-4 w-4" />
                  Align Right
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFormat('justifyFull')
                    setShowAlignMenu(false)
                  }}
                >
                  <AlignJustify className="h-4 w-4" />
                  Justify
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Insert Buttons */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded"
              onClick={insertImage}
              onMouseEnter={() => setShowImageTooltip(true)}
              onMouseLeave={() => setShowImageTooltip(false)}
              title="Insert Image"
            >
              <img src="/editor-icons/image.svg" alt="Image" />
            </button>
            {showImageTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap z-10">
                Upload Image
              </div>
            )}
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => applyFormat('formatBlock', '<pre>')}
            title="Code Block"
          >
            <img src="/editor-icons/block.svg" alt="Code Block" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => applyFormat('formatBlock', '<blockquote>')}
            title="Quote"
          >
            <img src="/editor-icons/''.svg" alt="Quote" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded"
            onClick={insertLink}
            title="Insert Link"
          >
            <img src="/editor-icons/link.svg" alt="Link" />
          </button>

          <div className="h-6 w-px bg-gray-300"></div>

          <div className="relative">
            <button 
              className="text-sm text-gray-600 px-2 hover:text-gray-800"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              Advanced Options
            </button>

            {/* Advanced Options Dropdown */}
            {showAdvancedOptions && (
              <div className="absolute top-full right-0 mt-5 bg-white border border-gray-200 rounded-lg p-6 shadow-lg z-20 w-[300px]">
                
                
                <div className="space-y-4">
                  {/* First Row */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        applyFormat('superscript')
                        setShowAdvancedOptions(false)
                      }}
                      className="p-3 hover:bg-gray-100 rounded"
                      title="Superscript"
                    >
                      <img src="/editor-icons/advance/super.svg" alt="Superscript" />
                    </button>
                    <button
                      onClick={() => {
                        applyFormat('subscript')
                        setShowAdvancedOptions(false)
                      }}
                      className="p-3 hover:bg-gray-100 rounded"
                      title="Subscript"
                    >
                      <img src="/editor-icons/advance/sub.svg" alt="Subscript" />
                    </button>
                    <button
                      className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded"
                      title="Text Color"
                    >
                      <img src="/editor-icons/advance/fill.svg" alt="Text Color" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded"
                      title="Line Spacing"
                    >
                      <img src="/editor-icons/advance/line-height.svg" alt="Line Spacing" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Second Row */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        applyFormat('indent')
                        setShowAdvancedOptions(false)
                      }}
                      className="p-3 hover:bg-gray-100 rounded"
                      title="Increase Indent"
                    >
                      <img src="/editor-icons/advance/increase-indent.svg" alt="Increase Indent" />
                    </button>
                    <button
                      onClick={() => {
                        applyFormat('outdent')
                        setShowAdvancedOptions(false)
                      }}
                      className="p-3 hover:bg-gray-100 rounded"
                      title="Decrease Indent"
                    >
                      <img src="/editor-icons/advance/decrease-indent.svg" alt="Decrease Indent" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div 
          ref={editorRef}
          contentEditable
          onInput={updateCounts}
          className="min-h-[400px] w-full border-0 focus:outline-none text-gray-700 prose max-w-none bg-transparent"
          data-placeholder="Start writing..."
          style={{
            fontFamily: font
          }}
        />

            {/* Spacer for fixed footer */}
            <div className="h-20"></div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="bottom-0 left-0 right-0 bg-white border-t py-3">
        <div className="max-w-5xl mx-auto px-6">
          {/* Character/Word Count - Top Right */}
          <div className="flex justify-end mb-2">
            <div className="text-sm text-gray-400">
              <span>Chars <span className="text-gray-600">{charCount}</span></span>
              <span className="mx-2">|</span>
              <span>Words <span className="text-gray-600">{wordCount}</span></span>
            </div>
          </div>

          {/* Centered Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button 
              variant="outline"
              onClick={handleSaveDraft}
              className="gap-2 text-gray-600 bg-white hover:bg-gray-50"
            >
              <img src="/editor-icons/draft.svg" alt="Draft" className="h-4 w-4" />
              Save to draft
            </Button>

            <Button 
              onClick={handlePublish}
              className="bg-black text-white hover:bg-gray-800 gap-2 px-6"
            >
              Publish
              <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
            </Button>

            <Input
              type="text"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              placeholder="dd-mm-yyyy"
              className="w-[110px] text-sm text-gray-400"
            />
            <Input
              type="text"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              placeholder="--:--"
              className="w-[70px] text-sm text-gray-400"
            />
            <Button variant="ghost" size="icon" className="text-gray-400">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSchedule}
              className="text-gray-400"
            >
              Schedule
            </Button>
          </div>
        </div>
          </div>
      </div>
    </>
  )
}
