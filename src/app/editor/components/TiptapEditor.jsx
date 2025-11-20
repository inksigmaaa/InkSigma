"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

import { LineHeight } from './extensions/LineHeight'
import { Indent } from './extensions/Indent'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp } from "lucide-react"
import { 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify 
} from "lucide-react"
import { ImageModal } from './ImageModal'

export function TiptapEditor({ onUpdate, initialContent = '' }) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showImageTooltip, setShowImageTooltip] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLineSpacing, setShowLineSpacing] = useState(false)
  const [currentFont, setCurrentFont] = useState('Roboto')
  const [isMounted, setIsMounted] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [listButtonRef, setListButtonRef] = useState(null)
  const [alignButtonRef, setAlignButtonRef] = useState(null)
  const [headingButtonRef, setHeadingButtonRef] = useState(null)
  const [advancedButtonRef, setAdvancedButtonRef] = useState(null)
  const [dropdownPositions, setDropdownPositions] = useState({
    heading: { top: 0, left: 0 },
    list: { top: 0, left: 0 },
    align: { top: 0, left: 0 },
    advanced: { top: 0, left: 0 }
  })

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
      // Core extensions not in StarterKit
      Underline,
      Superscript,
      Subscript,
      TextStyle,
      Color,
      
      // Custom extensions
      LineHeight.configure({
        types: ['paragraph', 'heading'],
      }),
      Indent.configure({
        types: ['paragraph', 'heading'],
      }),

      // Layout and media extensions
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
    setIsImageModalOpen(true)
  }

  const handleImageAdd = (imageData) => {
    if (editor && imageData.src) {
      const attributes = {
        src: imageData.src,
        alt: imageData.alt || '',
      }
      
      // Add width and height if provided
      if (imageData.width) {
        attributes.width = imageData.width
      }
      if (imageData.height) {
        attributes.height = imageData.height
      }
      
      editor.chain().focus().setImage(attributes).run()
    }
  }

  const insertLink = () => {
    // Get selected text if any
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')
    
    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkPopup(true)
  }

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, '')
      
      if (selectedText) {
        // If text is selected, just add the link to it
        editor?.chain().focus().setLink({ href: linkUrl.trim() }).run()
      } else {
        // If no text is selected, insert new text with link
        const textToInsert = linkText.trim() || linkUrl.trim()
        editor?.chain().focus().insertContent(`<a href="${linkUrl.trim()}">${textToInsert}</a>`).run()
      }
    }
    
    setShowLinkPopup(false)
    setLinkUrl('')
    setLinkText('')
  }

  const handleLinkCancel = () => {
    setShowLinkPopup(false)
    setLinkUrl('')
    setLinkText('')
  }

  const closeAllDropdowns = () => {
    setShowHeadingMenu(false)
    setShowListMenu(false)
    setShowAlignMenu(false)
    setShowAdvancedOptions(false)
    setShowColorPicker(false)
    setShowLineSpacing(false)
  }

  const setTextColor = (color) => {
    if (editor) {
      const { from, to } = editor.state.selection
      
      if (from === to) {
        // No selection - show alert to user
        alert('Please select some text first to apply color')
        setShowColorPicker(false)
        return
      }
      
      if (color === '') {
        // Remove color by unsetting it
        editor.chain().focus().unsetColor().run()
      } else {
        // Apply color to selected text
        editor.chain().focus().setColor(color).run()
      }
    }
    setShowColorPicker(false)
  }

  const setLineHeight = (height) => {
    if (editor) {
      // Try to apply line height to current paragraph
      const { from } = editor.state.selection
      const $pos = editor.state.doc.resolve(from)
      
      // Find the paragraph node
      let paragraphPos = null
      for (let i = $pos.depth; i >= 0; i--) {
        const node = $pos.node(i)
        if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
          paragraphPos = $pos.start(i)
          break
        }
      }
      
      if (paragraphPos !== null) {
        // Select the paragraph and apply line height
        const paragraphEnd = $pos.end($pos.depth - ($pos.depth - 1))
        editor.chain()
          .focus()
          .setTextSelection({ from: paragraphPos, to: paragraphEnd })
          .setLineHeight(height)
          .run()
        
        // Restore cursor position
        editor.chain().focus().setTextSelection(from).run()
      } else {
        // Fallback: just try to apply it
        editor.chain().focus().setLineHeight(height).run()
      }
    }
    setShowLineSpacing(false)
  }

  const increaseIndent = () => {
    if (editor?.isActive('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run()
    } else {
      editor.chain().focus().indent().run()
    }
  }

  const decreaseIndent = () => {
    if (editor?.isActive('listItem')) {
      editor.chain().focus().liftListItem('listItem').run()
    } else {
      editor.chain().focus().outdent().run()
    }
  }

  const updateDropdownPositions = () => {
    const newPositions = { ...dropdownPositions }
    
    if (headingButtonRef) {
      const rect = headingButtonRef.getBoundingClientRect()
      newPositions.heading = { top: rect.bottom + 4, left: rect.left }
    }
    
    if (listButtonRef) {
      const rect = listButtonRef.getBoundingClientRect()
      newPositions.list = { top: rect.bottom + 4, left: rect.left }
    }
    
    if (alignButtonRef) {
      const rect = alignButtonRef.getBoundingClientRect()
      newPositions.align = { top: rect.bottom + 4, left: rect.left }
    }
    
    if (advancedButtonRef) {
      const rect = advancedButtonRef.getBoundingClientRect()
      newPositions.advanced = { top: rect.bottom + 4, left: rect.right - 300 }
    }
    
    setDropdownPositions(newPositions)
  }

  // Update positions when dropdowns are shown
  useEffect(() => {
    if (showHeadingMenu || showListMenu || showAlignMenu || showAdvancedOptions) {
      updateDropdownPositions()
    }
  }, [showHeadingMenu, showListMenu, showAlignMenu, showAdvancedOptions, headingButtonRef, listButtonRef, alignButtonRef, advancedButtonRef])

  // Close dropdowns when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container') && 
          !event.target.closest('.color-picker') && 
          !event.target.closest('.line-spacing-picker')) {
        closeAllDropdowns()
      }
    }

    let scrollTimeout
    const handleScroll = () => {
      // Immediately close dropdowns on any scroll
      closeAllDropdowns()
      
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }

    const handleWheel = (e) => {
      // Close dropdowns immediately on wheel events
      closeAllDropdowns()
    }

    const handleTouchMove = () => {
      // Close dropdowns on touch scroll
      closeAllDropdowns()
    }

    // Add event listeners to all possible scroll sources
    document.addEventListener('mousedown', handleClickOutside)
    
    // Window scroll events
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('resize', closeAllDropdowns)
    
    // Document scroll events
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    
    // Also listen for scroll on the editor container specifically
    const editorContainer = document.querySelector('.prose')
    if (editorContainer) {
      editorContainer.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, { capture: true })
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', closeAllDropdowns)
      document.removeEventListener('scroll', handleScroll, { capture: true })
      
      if (editorContainer) {
        editorContainer.removeEventListener('scroll', handleScroll)
      }
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [])

  // Specific handler for link popup click outside
  useEffect(() => {
    if (!showLinkPopup) return

    const handleLinkPopupClickOutside = (event) => {
      const linkPopupElement = document.querySelector('.link-popup')
      const linkButtonElement = linkButtonRef
      
      if (linkPopupElement && !linkPopupElement.contains(event.target) && 
          linkButtonElement && !linkButtonElement.contains(event.target)) {
        setShowLinkPopup(false)
        setLinkUrl('')
        setLinkText('')
      }
    }

    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleLinkPopupClickOutside)
      document.addEventListener('click', handleLinkPopupClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleLinkPopupClickOutside)
      document.removeEventListener('click', handleLinkPopupClickOutside)
    }
  }, [showLinkPopup, linkButtonRef])

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
    <div className="w-full relative" style={{ overflow: 'visible', zIndex: 1 }}>
      {/* Toolbar */}
      <div className="flex items-center md:gap-2 py-3 border-b border-gray-200 overflow-x-auto scrollbar-hide whitespace-nowrap relative" style={{ minHeight: '60px', overflowY: 'visible', zIndex: 10 }}>
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
              ref={setHeadingButtonRef}
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
            {showHeadingMenu && headingButtonRef && isMounted && createPortal(
              <div 
                className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[80px] border-gray-300"
                style={{
                  zIndex: 9999,
                  top: `${dropdownPositions.heading.top}px`,
                  left: `${dropdownPositions.heading.left}px`,
                }}
              >
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
              </div>,
              document.body
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
            ref={setListButtonRef}
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
          {showListMenu && listButtonRef && isMounted && createPortal(
            <div 
              className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[150px] border-gray-300"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.list.top}px`,
                left: `${dropdownPositions.list.left}px`,
              }}
            >
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
            </div>,
            document.body
          )}
        </div>

        {/* Align Button with Dropdown */}
        <div className="relative dropdown-container shrink-0">
          <button 
            ref={setAlignButtonRef}
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
          {showAlignMenu && alignButtonRef && isMounted && createPortal(
            <div 
              className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[150px] border-gray-300"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.align.top}px`,
                left: `${dropdownPositions.align.left}px`,
              }}
            >
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
            </div>,
            document.body
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
        <div className="relative dropdown-container shrink-0">
          <button 
            ref={setLinkButtonRef}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded"
            onClick={insertLink}
            title="Insert Link"
          >
            <img src="/editor-icons/link.svg" alt="Link" className="w-5 h-5" />
          </button>
          {showLinkPopup && linkButtonRef && isMounted && createPortal(
            <div 
              className="link-popup fixed bg-white border rounded-md shadow-xl p-4 min-w-[300px] border-gray-300"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.link.top}px`,
                left: `${dropdownPositions.link.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleLinkSubmit()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleLinkCancel()
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Text (optional)
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Link text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleLinkSubmit()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleLinkCancel()
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleLinkCancel}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkSubmit}
                    disabled={!linkUrl.trim()}
                    className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Insert Link
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>

        <div className="h-6 w-px bg-gray-300 shrink-0 hidden md:block"></div>

        <div className="relative dropdown-container shrink-0 hidden md:block">
          <button 
            ref={setAdvancedButtonRef}
            className="text-xs md:text-sm text-gray-600 px-2 hover:text-gray-800 whitespace-nowrap"
            onClick={() => {
              if (!showAdvancedOptions) closeAllDropdowns()
              setShowAdvancedOptions(!showAdvancedOptions)
            }}
          >
            Advanced Options
          </button>

          {/* Advanced Options Dropdown */}
          {showAdvancedOptions && advancedButtonRef && isMounted && createPortal(
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg p-6 shadow-lg w-[300px]"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.advanced.top}px`,
                left: `${dropdownPositions.advanced.left}px`,
              }}
            >
              <div className="space-y-4">
                
                <div className="flex items-center gap-4">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (editor) {
                        editor.chain().focus().toggleSuperscript().run()
                      }
                    }}
                    className={`p-3 hover:bg-gray-100 rounded ${editor?.isActive('superscript') ? 'bg-gray-200' : ''}`}
                    title="Superscript"
                  >
                    <img src="/editor-icons/advance/super.svg" alt="Superscript" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (editor) {
                        editor.chain().focus().toggleSubscript().run()
                      }
                    }}
                    className={`p-3 hover:bg-gray-100 rounded ${editor?.isActive('subscript') ? 'bg-gray-200' : ''}`}
                    title="Subscript"
                  >
                    <img src="/editor-icons/advance/sub.svg" alt="Subscript" />
                  </button>
                  
                  {/* Text Color Dropdown */}
                  <div className="relative">
                    <button 
                      className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded" 
                      title="Text Color"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowColorPicker(!showColorPicker)
                      }}
                    >
                      <img src="/editor-icons/advance/fill.svg" alt="Text Color" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showColorPicker && (
                      <div className="color-picker absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg p-2 grid grid-cols-4 gap-1 min-w-[120px] z-[10000]">
                        {[
                          { color: '#000000', name: 'Black' },
                          { color: '#FF0000', name: 'Red' },
                          { color: '#00FF00', name: 'Green' },
                          { color: '#0000FF', name: 'Blue' },
                          { color: '#FFFF00', name: 'Yellow' },
                          { color: '#FF00FF', name: 'Magenta' },
                          { color: '#00FFFF', name: 'Cyan' },
                          { color: '#FFA500', name: 'Orange' },
                          { color: '#800080', name: 'Purple' },
                          { color: '#008000', name: 'Dark Green' },
                          { color: '#FFC0CB', name: 'Pink' },
                          { color: '#A52A2A', name: 'Brown' }
                        ].map(({ color, name }) => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setTextColor(color)
                            }}
                            title={name}
                          />
                        ))}
                        <button
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white relative"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setTextColor('')
                          }}
                          title="Remove Color"
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs">×</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Line Spacing Dropdown */}
                  <div className="relative">
                    <button 
                      className="flex items-center gap-1 p-3 hover:bg-gray-100 rounded" 
                      title="Line Spacing"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowLineSpacing(!showLineSpacing)
                      }}
                    >
                      <img src="/editor-icons/advance/line-height.svg" alt="Line Spacing" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showLineSpacing && (
                      <div className="line-spacing-picker absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[100px] z-[10000]">
                        {['1', '1.15', '1.5', '2', '2.5', '3'].map((height) => (
                          <button
                            key={height}
                            className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setLineHeight(height)
                            }}
                          >
                            {height}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      increaseIndent()
                    }}
                    className="p-3 hover:bg-gray-100 rounded"
                    title="Increase Indent"
                  >
                    <img src="/editor-icons/advance/increase-indent.svg" alt="Increase Indent" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      decreaseIndent()
                    }}
                    className="p-3 hover:bg-gray-100 rounded"
                    title="Decrease Indent"
                  >
                    <img src="/editor-icons/advance/decrease-indent.svg" alt="Decrease Indent" />
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Editor Content - Text Typing Area */}
      <div className="mt-4 border border-gray-200 rounded-lg bg-white" style={{ position: 'relative', zIndex: 1 }}>
        <EditorContent 
          editor={editor} 
          className="prose max-w-none focus:outline-none"
        />
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageAdd={handleImageAdd}
      />
    </div>
  )
}