"use client"

import { useState, useRef } from "react"
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
  Send,
  Calendar,
  Check
} from "lucide-react"


export default function EditorPage() {
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
  const editorRef = useRef(null)

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

  return (
    <>
      <div className="min-h-screen bg-white">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
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
            className="text-4xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-gray-300"
          />
        </div>

        {/* Description */}
        <div>
          <Input
            type="text"
            placeholder="Write your Short Description for your Blog"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-gray-400 border-0 px-0 focus-visible:ring-0 placeholder:text-gray-300"
          />
        </div>

        {/* Category and Thumbnail */}
        <div className="flex items-center gap-4 py-4 border-b">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Thumbnail Image
          </Button>

          <div className="ml-auto flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Saved</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 py-4 border-b flex-wrap">
          {/* Font Selector */}
          <Select value={font} onValueChange={applyFontFamily}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Arial Black">Arial Black</SelectItem>
              <SelectItem value="Brush Script MT">Brush Script MT</SelectItem>
              <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Garamond">Garamond</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Impact">Impact</SelectItem>
              <SelectItem value="Lucida Console">Lucida Console</SelectItem>
              <SelectItem value="Lucida Sans Unicode">Lucida Sans Unicode</SelectItem>
              <SelectItem value="Palatino Linotype">Palatino Linotype</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>

          {/* Heading Selector */}
          <Select value={heading} onValueChange={applyHeading}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P">P</SelectItem>
              <SelectItem value="H1">H1</SelectItem>
              <SelectItem value="H2">H2</SelectItem>
              <SelectItem value="H3">H3</SelectItem>
              <SelectItem value="H4">H4</SelectItem>
              <SelectItem value="H5">H5</SelectItem>
              <SelectItem value="H6">H6</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Format Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormat('bold')}
            className="h-8 w-8"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormat('italic')}
            className="h-8 w-8"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormat('underline')}
            className="h-8 w-8"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormat('strikeThrough')}
            className="h-8 w-8"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* List Button with Dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onMouseDown={(e) => {
                e.preventDefault()
                setShowListMenu(!showListMenu)
              }}
              title="Lists"
            >
              <List className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onMouseDown={(e) => {
                e.preventDefault()
                setShowAlignMenu(!showAlignMenu)
              }}
              title="Alignment"
            >
              <AlignLeft className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={insertImage}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyFormat('formatBlock', '<pre>')}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyFormat('formatBlock', '<blockquote>')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={insertLink}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300"></div>

          <Button variant="ghost" className="text-sm">
            Advanced Options
          </Button>
        </div>

        {/* Editor Area */}
        <div 
          ref={editorRef}
          contentEditable
          onInput={updateCounts}
          className="min-h-[400px] w-full border-0 focus:outline-none text-gray-700 prose max-w-none"
          data-placeholder="Start writing..."
          style={{
            fontFamily: font
          }}
        />

            {/* Spacer for fixed footer */}
            <div className="h-20"></div>
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
              onClick={handlePublish}
              className="bg-black text-white hover:bg-gray-800 gap-2 px-6"
            >
              Publish
              <Send className="h-4 w-4" />
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
