"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from "lucide-react"
import { 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify 
} from "lucide-react"

export function TiptapEditor({ onUpdate, initialContent = '' }) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showImageTooltip, setShowImageTooltip] = useState(false)
  const [currentFont, setCurrentFont] = useState('Roboto')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fonts = [
    "Arial", "Arial Black", "Brush Script MT", "Comic Sans MS", 
    "Courier New", "Garamond", "Georgia", "Helvetica", "Impact", 
    "Lucida Console", "Lucida Sans Unicode", "Palatino Linotype", 
    "Roboto", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"
  ]

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      onUpdate?.({
        html,
        text,
        charCount: text.length,
        wordCount: text.trim() ? text.trim().split(/\s+/).length : 0
      })
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] md:min-h-[400px] text-base md:text-lg text-gray-700 p-4',
        style: `font-family: ${currentFont}, sans-serif;`,
      },
    },
  })

  const cycleFontUp = () => {
    const currentIndex = fonts.indexOf(currentFont)
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : fonts.length - 1
    const newFont = fonts[nextIndex]
    setCurrentFont(newFont)
    
    // Apply font to editor
    if (editor) {
      const { view } = editor
      view.dom.style.fontFamily = `${newFont}, sans-serif`
    }
  }

  const cycleFontDown = () => {
    const currentIndex = fonts.indexOf(currentFont)
    const nextIndex = currentIndex < fonts.length - 1 ? currentIndex + 1 : 0
    const newFont = fonts[nextIndex]
    setCurrentFont(newFont)
    
    // Apply font to editor
    if (editor) {
      const { view } = editor
      view.dom.style.fontFamily = `${newFont}, sans-serif`
    }
  }

  const setHeading = (level) => {
    if (level === 'P') {
      editor?.chain().focus().setParagraph().run()
    } else {
      const headingLevel = parseInt(level.replace('H', ''))
      editor?.chain().focus().toggleHeading({ level: headingLevel }).run()
    }
    setShowHeadingMenu(false)
  }

  const insertImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  const insertLink = () => {
    const url = window.prompt('Enter link URL:')
    if (url) {
      const text = window.prompt('Enter link text:') || url
      editor?.chain().focus().setLink({ href: url }).insertContent(text).run()
    }
  }

  const closeAllDropdowns = () => {
    setShowHeadingMenu(false)
    setShowListMenu(false)
    setShowAlignMenu(false)
    setShowAdvancedOptions(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isMounted || !editor) {
    return (
      <div className="w-full">
        {/* Toolbar Skeleton */}
        <div className="flex items-center md:gap-2 py-3 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        {/* Editor Skeleton */}
        <div className="mt-4 border border-gray-200 rounded-lg bg-white">
          <div className="p-4 min-h-[300px] md:min-h-[400px] flex items-start">
            <div className="text-gray-400">Start writing...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative" style={{ overflow: 'visible' }}>
      {/* Toolbar */}
      <div className="flex items-center md:gap-2 py-3 border-b border-gray-200 overflow-x-auto scrollbar-hide whitespace-nowrap relative z-50" style={{ minHeight: '60px', overflowY: 'visible' }}>
        {/* Font Selector */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          <span className="text-sm md:text-base font-normal text-gray-700 w-[80px] md:w-[100px] truncate">
            {currentFont}
          </span>
          <div className="flex flex-col -space-y-1">
            <button onClick={cycleFontUp} className="hover:bg-gray-100 rounded p-0.5">
              <ChevronUp className="h-3 w-3 text-gray-600" />
            </button>
            <button onClick={cycleFontDown} className="hover:bg-gray-100 rounded p-0.5">
              <ChevronDown className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300 shrink-0"></div>

        {/* Heading Selector */}
        <div className="flex items-center gap-1.5 md:gap-2 dropdown-container shrink-0 relative">
          <img src="/editor-icons/P.svg" alt="P" className="w-5 h-5" />
          <div className="relative">
            <button
              className="flex items-center hover:bg-gray-100 rounded px-1"
              onMouseDown={(e) => {
                e.preventDefault()
                if (!showHeadingMenu) closeAllDropdowns()
                setShowHeadingMenu(!showHeadingMenu)
              }}
            >
              <img src="/editor-icons/H.svg" alt="H" className="w-5 h-5" />
              <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
            </button>
            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-xl z-[200] py-1 min-w-[80px] border-gray-300">
                {['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
                  <button
                    key={heading}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setHeading(heading)
                    }}
                  >
                    {heading}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300 shrink-0"></div>

        {/* Format Buttons */}
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          title="Bold"
        >
          <img src="/editor-icons/B.svg" alt="Bold" className="w-5 h-5" />
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          title="Italic"
        >
          <img src="/editor-icons/italic.svg" alt="Italic" className="w-5 h-5" />
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          title="Underline"
        >
          <img src="/editor-icons/underline.svg" alt="Underline" className="w-5 h-5" />
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
          title="Strikethrough"
        >
          <img src="/editor-icons/strike.svg" alt="Strikethrough" className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-300 shrink-0"></div>

        {/* List Button with Dropdown */}
        <div className="relative dropdown-container shrink-0">
          <button 
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showListMenu) closeAllDropdowns()
              setShowListMenu(!showListMenu)
            }}
            title="Lists"
          >
            <img src="/editor-icons/list.svg" alt="Lists" className="w-5 h-5" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showListMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-xl z-[200] py-1 min-w-[150px] border-gray-300">
              <button
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleBulletList().run()
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
                  editor.chain().focus().toggleOrderedList().run()
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
        <div className="relative dropdown-container shrink-0">
          <button 
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showAlignMenu) closeAllDropdowns()
              setShowAlignMenu(!showAlignMenu)
            }}
            title="Alignment"
          >
            <img src="/editor-icons/Paragraph.svg" alt="Alignment" className="w-5 h-5" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showAlignMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-xl z-[200] py-1 min-w-[150px] border-gray-300">
              <button
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().setTextAlign('left').run()
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
                  editor.chain().focus().setTextAlign('center').run()
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
                  editor.chain().focus().setTextAlign('right').run()
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
                  editor.chain().focus().setTextAlign('justify').run()
                  setShowAlignMenu(false)
                }}
              >
                <AlignJustify className="h-4 w-4" />
                Justify
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-300 shrink-0"></div>

        {/* Insert Buttons */}
        <div className="relative shrink-0">
          <button 
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded"
            onClick={insertImage}
            onMouseEnter={() => setShowImageTooltip(true)}
            onMouseLeave={() => setShowImageTooltip(false)}
            title="Insert Image"
          >
            <img src="/editor-icons/image.svg" alt="Image" className="w-5 h-5" />
          </button>
          {showImageTooltip && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap z-[200]">
              Upload Image
            </div>
          )}
        </div>
        <button 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <img src="/editor-icons/block.svg" alt="Code Block" className="w-5 h-5" />
        </button>
        <button 
          className={`p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <img src="/editor-icons/''.svg" alt="Quote" className="w-5 h-5" />
        </button>
        <button 
          className="p-1.5 md:p-2 hover:bg-gray-100 rounded shrink-0"
          onClick={insertLink}
          title="Insert Link"
        >
          <img src="/editor-icons/link.svg" alt="Link" className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-300 shrink-0 hidden md:block"></div>

        <div className="relative dropdown-container shrink-0 hidden md:block">
          <button 
            className="text-xs md:text-sm text-gray-600 px-2 hover:text-gray-800 whitespace-nowrap"
            onClick={() => {
              if (!showAdvancedOptions) closeAllDropdowns()
              setShowAdvancedOptions(!showAdvancedOptions)
            }}
          >
            Advanced Options
          </button>

          {/* Advanced Options Dropdown */}
          {showAdvancedOptions && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg p-6 shadow-lg z-[200] w-[300px]">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      // Placeholder for superscript
                      setShowAdvancedOptions(false)
                    }}
                    className="p-3 hover:bg-gray-100 rounded"
                    title="Superscript"
                  >
                    <img src="/editor-icons/advance/super.svg" alt="Superscript" />
                  </button>
                  <button
                    onClick={() => {
                      // Placeholder for subscript
                      setShowAdvancedOptions(false)
                    }}
                    className="p-3 hover:bg-gray-100 rounded"
                    title="Subscript"
                  >
                    <img src="/editor-icons/advance/sub.svg" alt="Subscript" />
                  </button>
                  <button className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded" title="Text Color">
                    <img src="/editor-icons/advance/fill.svg" alt="Text Color" />
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded" title="Line Spacing">
                    <img src="/editor-icons/advance/line-height.svg" alt="Line Spacing" />
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      // Placeholder for indent
                      setShowAdvancedOptions(false)
                    }}
                    className="p-3 hover:bg-gray-100 rounded"
                    title="Increase Indent"
                  >
                    <img src="/editor-icons/advance/increase-indent.svg" alt="Increase Indent" />
                  </button>
                  <button
                    onClick={() => {
                      // Placeholder for outdent
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

      {/* Editor Content - Text Typing Area */}
      <div className="mt-4 border border-gray-200 rounded-lg bg-white">
        <EditorContent 
          editor={editor} 
          className="prose max-w-none focus:outline-none"
        />
      </div>
    </div>
  )
}