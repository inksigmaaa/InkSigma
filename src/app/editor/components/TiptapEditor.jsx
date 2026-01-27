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
import { useState, useEffect, useRef } from 'react'
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
import { getImageUrl } from '@/utils/imageUrl'

// Helper function to convert full URLs back to relative paths for storage
const stripImageUrls = (html) => {
  if (!html) return html

  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  // Match img tags with src attributes
  return html.replace(/src="([^"]*)"/g, (match, src) => {
    if (!src) return match

    // If it's a full URL pointing to our API, convert to relative path
    if (src.startsWith(apiUrl)) {
      const relativePath = src.substring(apiUrl.length)
      return `src="${relativePath}"`
    }

    // Otherwise return as is
    return match
  })
}

export function TiptapEditor({ onUpdate, initialContent = '', onImageModalToggle }) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showImageTooltip, setShowImageTooltip] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLineSpacing, setShowLineSpacing] = useState(false)
  const [showLinkPopup, setShowLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [currentFont, setCurrentFont] = useState('Roboto')
  const [isMounted, setIsMounted] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [listButtonRef, setListButtonRef] = useState(null)
  const [alignButtonRef, setAlignButtonRef] = useState(null)
  const [headingButtonRef, setHeadingButtonRef] = useState(null)
  const [advancedButtonRef, setAdvancedButtonRef] = useState(null)
  const [linkButtonRef, setLinkButtonRef] = useState(null)
  const [imageButtonRef, setImageButtonRef] = useState(null)
  const [imageTooltipPos, setImageTooltipPos] = useState({ top: 0, left: 0 })
  const [dropdownPositions, setDropdownPositions] = useState({
    heading: { top: 0, left: 0 },
    list: { top: 0, left: 0 },
    align: { top: 0, left: 0 },
    advanced: { top: 0, left: 0 },
    link: { top: 0, left: 0 },
    lineSpacing: { top: 0, left: 0 }
  })

  // Track if initial content has been set to prevent infinite loop
  const initialContentSetRef = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update positions when dropdowns are shown
  useEffect(() => {
    if (showHeadingMenu || showListMenu || showAlignMenu || showAdvancedOptions || showLinkPopup) {
      updateDropdownPositions()
    }
  }, [showHeadingMenu, showListMenu, showAlignMenu, showAdvancedOptions, showLinkPopup, headingButtonRef, listButtonRef, alignButtonRef, advancedButtonRef, linkButtonRef])

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
      // Strip full URLs back to relative paths before saving
      const strippedHtml = stripImageUrls(html)
      onUpdate?.({
        html: strippedHtml,
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

  // Update editor content when initialContent changes (must be after useEditor)
  useEffect(() => {
    if (editor && initialContent && !initialContentSetRef.current) {
      // Convert relative image URLs to full URLs for display in editor
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const processedContent = initialContent.replace(/src="([^"]*)"/g, (match, src) => {
        if (!src) return match

        // If it's already a full URL, return as is
        if (src.startsWith('http://') || src.startsWith('https://')) {
          return match
        }

        // If it's a relative path starting with /, prepend the API URL
        if (src.startsWith('/')) {
          return `src="${apiUrl}${src}"`
        }

        // Otherwise, assume it's a relative path and prepend API URL with /
        return `src="${apiUrl}/${src}"`
      })

      if (editor.getHTML() !== processedContent) {
        editor.commands.setContent(processedContent)
        initialContentSetRef.current = true
      }
    }
  }, [editor, initialContent])

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
    onImageModalToggle?.(true)
  }

  const handleImageAdd = (imageData) => {
    if (editor && imageData.src) {
      // Convert relative path to full URL for display in editor
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      let fullImageUrl = imageData.src

      // If it's a relative path, convert to full URL
      if (!fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://')) {
        if (fullImageUrl.startsWith('/')) {
          fullImageUrl = `${apiUrl}${fullImageUrl}`
        } else {
          fullImageUrl = `${apiUrl}/${fullImageUrl}`
        }
      }

      const attributes = {
        src: fullImageUrl,
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
    if (!editor) return
    // Get selected text if any
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')

    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkPopup(true)
  }

  const handleLinkSubmit = () => {
    if (!editor) return
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
    setShowLinkPopup(false)
  }

  const setTextColor = (color) => {
    if (editor) {
      const { from, to } = editor.state.selection

      if (from === to) {
        // No selection - apply color as a mark for future text
        if (color === '') {
          editor.chain().focus().unsetColor().run()
        } else {
          editor.chain().focus().setColor(color).run()
        }
      } else {
        // Selection exists - apply color to selected text
        if (color === '') {
          editor.chain().focus().unsetColor().run()
        } else {
          editor.chain().focus().setColor(color).run()
        }
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
    if (!editor) return
    if (editor.isActive('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run()
    } else {
      editor.chain().focus().indent().run()
    }
  }

  const decreaseIndent = () => {
    if (!editor) return
    if (editor.isActive('listItem')) {
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
      newPositions.advanced = { top: rect.bottom + 4, left: rect.left }
    }

    if (linkButtonRef) {
      const rect = linkButtonRef.getBoundingClientRect()
      newPositions.link = { top: rect.bottom + 4, left: rect.left }
    }

    setDropdownPositions(newPositions)
  }

  // Update positions when dropdowns are shown
  useEffect(() => {
    if (showHeadingMenu || showListMenu || showAlignMenu || showAdvancedOptions || showLinkPopup) {
      updateDropdownPositions()
    }
  }, [showHeadingMenu, showListMenu, showAlignMenu, showAdvancedOptions, showLinkPopup, headingButtonRef, listButtonRef, alignButtonRef, advancedButtonRef, linkButtonRef])

  // Close dropdowns when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if any dropdown is open
      const isAnyDropdownOpen = showHeadingMenu || showListMenu || showAlignMenu || showAdvancedOptions || showColorPicker || showLineSpacing || showLinkPopup

      if (!isAnyDropdownOpen) return

      // Check if click is inside any dropdown or button
      const isInsideDropdown = event.target.closest('.dropdown-container') ||
        event.target.closest('.color-picker') ||
        event.target.closest('.line-spacing-picker') ||
        event.target.closest('.link-popup') ||
        event.target.closest('[role="dialog"]')

      if (!isInsideDropdown) {
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
    document.addEventListener('click', handleClickOutside)

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
      document.removeEventListener('click', handleClickOutside)
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
  }, [showHeadingMenu, showListMenu, showAlignMenu, showAdvancedOptions, showColorPicker, showLineSpacing, showLinkPopup])

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
    <div className="w-full relative bg-white" style={{ overflow: 'visible' }}>
      <style jsx>{`
        button:hover {
          border-bottom: none !important;
        }
        button:focus {
          border-bottom: none !important;
          outline: none !important;
        }
      `}</style>
      {/* Desktop Toolbar (xl: 1280px+) - Original with Font Selector */}
      <div
        className="hidden xl:flex items-center gap-1 md:gap-2 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full xl:max-w-[917px]"
        style={{ height: '52px', borderBottom: '1px solid #E5E7EB' }}
      >
        {/* Font Selector */}
        <div className="relative flex items-center gap-1 shrink-0 pr-2 border-r border-gray-200">
          <span className="text-sm font-normal text-gray-700 w-[70px] truncate">
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

        {/* Heading Selector */}
        <div className="flex items-center gap-1 dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('paragraph') ? 'bg-gray-200' : ''}`}
            title="Paragraph"
          >
            <img src="/editor-icons/P.svg" alt="P" className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              ref={setHeadingButtonRef}
              className="flex items-center hover:bg-gray-100 rounded px-1 py-1.5"
              onMouseDown={(e) => {
                e.preventDefault()
                if (!showHeadingMenu) {
                  closeAllDropdowns()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setDropdownPositions(prev => ({
                    ...prev,
                    heading: { top: rect.bottom + 4, left: rect.left }
                  }))
                  setShowHeadingMenu(true)
                } else {
                  setShowHeadingMenu(false)
                }
              }}
            >
              <img src="/editor-icons/H.svg" alt="H" className="w-5 h-5" />
              <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
            </button>
            {showHeadingMenu && headingButtonRef && isMounted && dropdownPositions.heading.top > 0 && createPortal(
              <div
                className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[80px] border-gray-300"
                style={{
                  zIndex: 9999,
                  top: `${dropdownPositions.heading.top}px`,
                  left: `${dropdownPositions.heading.left}px`,
                }}
              >
                {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
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

        {/* Format Buttons - B, I, U, S */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <img src="/editor-icons/B.svg" alt="Bold" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <img src="/editor-icons/italic.svg" alt="Italic" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline"
          >
            <img src="/editor-icons/underline.svg" alt="Underline" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
            title="Strikethrough"
          >
            <img src="/editor-icons/strike.svg" alt="Strikethrough" className="w-4 h-4" />
          </button>
        </div>

        {/* List Button with Dropdown */}
        <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            ref={setListButtonRef}
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showListMenu) {
                closeAllDropdowns()
                const rect = e.currentTarget.getBoundingClientRect()
                setDropdownPositions(prev => ({
                  ...prev,
                  list: { top: rect.bottom + 4, left: rect.left }
                }))
                setShowListMenu(true)
              } else {
                setShowListMenu(false)
              }
            }}
            title="Lists"
          >
            <img src="/editor-icons/list.svg" alt="Lists" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showListMenu && listButtonRef && isMounted && dropdownPositions.list.top > 0 && createPortal(
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
        <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            ref={setAlignButtonRef}
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showAlignMenu) {
                closeAllDropdowns()
                const rect = e.currentTarget.getBoundingClientRect()
                setDropdownPositions(prev => ({
                  ...prev,
                  align: { top: rect.bottom + 4, left: rect.left }
                }))
                setShowAlignMenu(true)
              } else {
                setShowAlignMenu(false)
              }
            }}
            title="Alignment"
          >
            <img src="/editor-icons/Paragraph.svg" alt="Alignment" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showAlignMenu && alignButtonRef && isMounted && dropdownPositions.align.top > 0 && createPortal(
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

        {/* Insert Buttons - Image, Code, Quote, Link */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
          <div className="relative shrink-0">
            <button
              ref={setImageButtonRef}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={insertImage}
              onMouseEnter={() => {
                if (imageButtonRef) {
                  const rect = imageButtonRef.getBoundingClientRect()
                  setImageTooltipPos({
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2
                  })
                  setShowImageTooltip(true)
                }
              }}
              onMouseLeave={() => setShowImageTooltip(false)}
              title="Insert Image"
            >
              <img src="/editor-icons/image.svg" alt="Image" className="w-4 h-4" />
            </button>
            {showImageTooltip && isMounted && createPortal(
              <div
                className="fixed bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap z-[9999] pointer-events-none"
                style={{
                  top: `${imageTooltipPos.top}px`,
                  left: `${imageTooltipPos.left}px`,
                  transform: 'translate(-50%, 0)'
                }}
              >
                Upload Image
              </div>,
              document.body
            )}
          </div>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <img src="/editor-icons/block.svg" alt="Code Block" className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <img src="/editor-icons/''.svg" alt="Quote" className="w-4 h-4" />
          </button>
          <div className="relative dropdown-container shrink-0">
            <button
              ref={setLinkButtonRef}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={(e) => {
                closeAllDropdowns()
                const rect = e.currentTarget.getBoundingClientRect()
                setDropdownPositions(prev => ({
                  ...prev,
                  link: { top: rect.bottom + 4, left: rect.left }
                }))
                insertLink()
              }}
              title="Insert Link"
            >
              <img src="/editor-icons/link.svg" alt="Link" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="relative dropdown-container shrink-0">
          <button
            ref={setAdvancedButtonRef}
            className="text-sm text-gray-600 px-3 py-1.5 hover:bg-gray-200 rounded whitespace-nowrap"
            style={{ backgroundColor: '#F8F8F8' }}
            onClick={(e) => {
              closeAllDropdowns()
              const rect = e.currentTarget.getBoundingClientRect()
              setDropdownPositions(prev => ({
                ...prev,
                advanced: { top: rect.bottom + 4, left: rect.right - 300 }
              }))
              setShowAdvancedOptions(true)
            }}
          >
            Advanced Options
          </button>
          {showAdvancedOptions && advancedButtonRef && isMounted && dropdownPositions.advanced.top > 0 && createPortal(
            <div
              className="fixed bg-white border rounded-md shadow-xl py-2 px-3 border-gray-300"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.advanced.top}px`,
                left: `${dropdownPositions.advanced.left}px`,
                minWidth: '300px'
              }}
            >
              {/* Superscript & Subscript */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 w-20">Script:</span>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleSuperscript().run()
                    setShowAdvancedOptions(false)
                  }}
                  className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor?.isActive('superscript') ? 'bg-gray-200' : ''}`}
                  title="Superscript"
                >
                  <img src="/editor-icons/advance/super.svg" alt="Superscript" className="w-4 h-4" />
                  Superscript
                </button>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleSubscript().run()
                    setShowAdvancedOptions(false)
                  }}
                  className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor?.isActive('subscript') ? 'bg-gray-200' : ''}`}
                  title="Subscript"
                >
                  <img src="/editor-icons/advance/sub.svg" alt="Subscript" className="w-4 h-4" />
                  Subscript
                </button>
              </div>

              {/* Line Spacing */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 w-20">Line Height:</span>
                <div className="flex gap-1">
                  {['1', '1.15', '1.5', '2', '2.5', '3'].map((height) => (
                    <button
                      key={height}
                      className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
                      onClick={() => {
                        setLineHeight(height)
                        setShowAdvancedOptions(false)
                      }}
                    >
                      {height}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indent */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Indent:</span>
                <button
                  onClick={() => {
                    increaseIndent()
                    setShowAdvancedOptions(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  title="Increase Indent"
                >
                  <img src="/editor-icons/advance/increase-indent.svg" alt="Increase" className="w-4 h-4" />
                  Increase
                </button>
                <button
                  onClick={() => {
                    decreaseIndent()
                    setShowAdvancedOptions(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  title="Decrease Indent"
                >
                  <img src="/editor-icons/advance/decrease-indent.svg" alt="Decrease" className="w-4 h-4" />
                  Decrease
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Mobile Toolbar (below md: 768px) - Desktop-style with Horizontal Scroll */}
      <div
        className="flex md:hidden items-center gap-1 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full"
        style={{
          height: '52px',
          borderBottom: '1px solid #E5E7EB',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Font Display (Fixed - Not Changeable) */}
        <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-gray-200">
          <span className="text-sm font-normal text-gray-700 w-[70px] truncate">
            {currentFont}
          </span>
        </div>

        {/* Heading Selector */}
        <div className="flex items-center gap-1 dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('paragraph') ? 'bg-gray-200' : ''}`}
            title="Paragraph"
          >
            <img src="/editor-icons/P.svg" alt="P" className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              ref={setHeadingButtonRef}
              className="flex items-center hover:bg-gray-100 rounded px-1 py-1.5"
              onMouseDown={(e) => {
                e.preventDefault()
                if (!showHeadingMenu) closeAllDropdowns()
                setShowHeadingMenu(!showHeadingMenu)
              }}
            >
              <img src="/editor-icons/H.svg" alt="H" className="w-5 h-5" />
              <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
            </button>
            {showHeadingMenu && headingButtonRef && isMounted && dropdownPositions.heading.top > 0 && createPortal(
              <div
                className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[80px] border-gray-300"
                style={{
                  zIndex: 9999,
                  top: `${dropdownPositions.heading.top}px`,
                  left: `${dropdownPositions.heading.left}px`,
                }}
              >
                {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
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

        {/* Format Buttons - B, I, U, S */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <img src="/editor-icons/B.svg" alt="Bold" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <img src="/editor-icons/italic.svg" alt="Italic" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline"
          >
            <img src="/editor-icons/underline.svg" alt="Underline" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
            title="Strikethrough"
          >
            <img src="/editor-icons/strike.svg" alt="Strikethrough" className="w-4 h-4" />
          </button>
        </div>

        {/* List Button with Dropdown */}
        <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            ref={setListButtonRef}
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showListMenu) closeAllDropdowns()
              setShowListMenu(!showListMenu)
            }}
            title="Lists"
          >
            <img src="/editor-icons/list.svg" alt="Lists" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showListMenu && listButtonRef && isMounted && dropdownPositions.list.top > 0 && createPortal(
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
        <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            ref={setAlignButtonRef}
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showAlignMenu) closeAllDropdowns()
              setShowAlignMenu(!showAlignMenu)
            }}
            title="Alignment"
          >
            <img src="/editor-icons/Paragraph.svg" alt="Alignment" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showAlignMenu && alignButtonRef && isMounted && dropdownPositions.align.top > 0 && createPortal(
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

        {/* Insert Buttons - Image, Code, Quote, Link */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <div className="relative shrink-0">
            <button
              className="p-1.5 hover:bg-gray-100 rounded focus:outline-none border-0"
              style={{ border: 'none', borderBottom: 'none' }}
              onClick={insertImage}
              title="Insert Image"
            >
              <img src="/editor-icons/image.svg" alt="Image" className="w-4 h-4" />
            </button>
          </div>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <img src="/editor-icons/block.svg" alt="Code Block" className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <img src="/editor-icons/''.svg" alt="Quote" className="w-4 h-4" />
          </button>
          <div className="relative dropdown-container shrink-0">
            <button
              ref={setLinkButtonRef}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={() => {
                closeAllDropdowns()
                insertLink()
              }}
              title="Insert Link"
            >
              <img src="/editor-icons/link.svg" alt="Link" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Options - Inline */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <button
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('superscript') ? 'bg-gray-200' : ''}`}
            title="Superscript"
          >
            <img src="/editor-icons/advance/super.svg" alt="Superscript" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('subscript') ? 'bg-gray-200' : ''}`}
            title="Subscript"
          >
            <img src="/editor-icons/advance/sub.svg" alt="Subscript" className="w-4 h-4" />
          </button>
        </div>

        {/* Line Spacing */}
        <div className="relative shrink-0 px-1 border-r border-gray-200">
          <button
            ref={(el) => {
              if (el && !dropdownPositions.lineSpacing) {
                const rect = el.getBoundingClientRect()
                setDropdownPositions(prev => ({
                  ...prev,
                  lineSpacing: { top: rect.bottom + 4, left: rect.left }
                }))
              }
            }}
            className="flex items-center gap-0.5 p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Line Spacing"
            onClick={() => {
              closeAllDropdowns()
              setShowLineSpacing(!showLineSpacing)
            }}
          >
            <img src="/editor-icons/advance/line-height.svg" alt="Line Spacing" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showLineSpacing && isMounted && dropdownPositions.lineSpacing?.top > 0 && createPortal(
            <div className="line-spacing-picker fixed bg-white border rounded-md shadow-lg py-1 min-w-[100px]"
              style={{
                zIndex: 10001,
                top: `${dropdownPositions.lineSpacing?.top || 0}px`,
                left: `${dropdownPositions.lineSpacing?.left || 0}px`,
              }}
              onClick={(e) => e.stopPropagation()}>
              {['1', '1.15', '1.5', '2', '2.5', '3'].map((height) => (
                <button
                  key={height}
                  className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                  onClick={() => setLineHeight(height)}
                >
                  {height}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {/* Indent Buttons */}
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          <button
            onClick={increaseIndent}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Increase Indent"
          >
            <img src="/editor-icons/advance/increase-indent.svg" alt="Increase Indent" className="w-4 h-4" />
          </button>
          <button
            onClick={decreaseIndent}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Decrease Indent"
          >
            <img src="/editor-icons/advance/decrease-indent.svg" alt="Decrease Indent" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tablet Toolbar (md to xl: 768px-1279px) - Simplified with Undo/Redo */}
      <div
        className="hidden md:flex xl:hidden items-center gap-1 md:gap-2 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full"
        style={{
          height: '52px',
          borderBottom: '1px solid #E5E7EB',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-0.5 shrink-0 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().chain().focus().undo().run()}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().chain().focus().redo().run()}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Normal Text Dropdown (with P, H1-H6) */}
        <div className="relative dropdown-container shrink-0 pr-2 border-r border-gray-200">
          <button
            ref={setHeadingButtonRef}
            className="flex items-center hover:bg-gray-100 rounded px-2 py-1.5 text-sm"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showHeadingMenu) closeAllDropdowns()
              setShowHeadingMenu(!showHeadingMenu)
            }}
          >
            <span className="text-gray-700">
              {editor?.isActive('heading', { level: 1 }) ? 'Heading 1' :
                editor?.isActive('heading', { level: 2 }) ? 'Heading 2' :
                  editor?.isActive('heading', { level: 3 }) ? 'Heading 3' :
                    editor?.isActive('heading', { level: 4 }) ? 'Heading 4' :
                      editor?.isActive('heading', { level: 5 }) ? 'Heading 5' :
                        editor?.isActive('heading', { level: 6 }) ? 'Heading 6' :
                          'Normal text'}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-600 ml-1" />
          </button>
          {showHeadingMenu && headingButtonRef && isMounted && dropdownPositions.heading.top > 0 && createPortal(
            <div
              className="fixed bg-white border rounded-md shadow-xl py-1 min-w-[140px] border-gray-300"
              style={{
                zIndex: 9999,
                top: `${dropdownPositions.heading.top}px`,
                left: `${dropdownPositions.heading.left}px`,
              }}
            >
              <button
                className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setHeading('P')
                }}
              >
                Normal text
              </button>
              {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
                <button
                  key={heading}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setHeading(heading)
                  }}
                >
                  Heading {heading.replace('H', '')}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {/* Format Buttons - B, I, U, S */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <img src="/editor-icons/B.svg" alt="Bold" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <img src="/editor-icons/italic.svg" alt="Italic" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline"
          >
            <img src="/editor-icons/underline.svg" alt="Underline" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
            title="Strikethrough"
          >
            <img src="/editor-icons/strike.svg" alt="Strikethrough" className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Align Button with Dropdown */}
        <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
          <button
            ref={setAlignButtonRef}
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showAlignMenu) closeAllDropdowns()
              setShowAlignMenu(!showAlignMenu)
            }}
            title="Alignment"
          >
            <img src="/editor-icons/Paragraph.svg" alt="Alignment" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
          {showAlignMenu && alignButtonRef && isMounted && dropdownPositions.align.top > 0 && createPortal(
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

        {/* Insert Buttons - Image, Code, Quote, Link */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <div className="relative shrink-0">
            <button
              className="p-1.5 hover:bg-gray-100 rounded focus:outline-none border-0"
              style={{ border: 'none', borderBottom: 'none' }}
              onClick={insertImage}
              onMouseEnter={() => setShowImageTooltip(true)}
              onMouseLeave={() => setShowImageTooltip(false)}
              title="Insert Image"
            >
              <img src="/editor-icons/image.svg" alt="Image" className="w-4 h-4" />
            </button>
            {showImageTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap z-[200]">
                Upload Image
              </div>
            )}
          </div>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <img src="/editor-icons/block.svg" alt="Code Block" className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <img src="/editor-icons/''.svg" alt="Quote" className="w-4 h-4" />
          </button>
          <div className="relative dropdown-container shrink-0">
            <button
              ref={setLinkButtonRef}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={() => {
                closeAllDropdowns()
                insertLink()
              }}
              title="Insert Link"
            >
              <img src="/editor-icons/link.svg" alt="Link" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Options - Inline */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
          <button
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('superscript') ? 'bg-gray-200' : ''}`}
            title="Superscript"
          >
            <img src="/editor-icons/advance/super.svg" alt="Superscript" className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            className={`p-1.5 hover:bg-gray-100 rounded shrink-0 ${editor?.isActive('subscript') ? 'bg-gray-200' : ''}`}
            title="Subscript"
          >
            <img src="/editor-icons/advance/sub.svg" alt="Subscript" className="w-4 h-4" />
          </button>
        </div>

        {/* Line Spacing */}
        <div className="relative shrink-0 px-1 border-r border-gray-200">
          <button
            ref={(el) => {
              if (el && !dropdownPositions.lineSpacing) {
                const rect = el.getBoundingClientRect()
                setDropdownPositions(prev => ({
                  ...prev,
                  lineSpacing: { top: rect.bottom + 4, left: rect.left }
                }))
              }
            }}
            className="flex items-center gap-0.5 p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Line Spacing"
            onClick={() => {
              closeAllDropdowns()
              setShowLineSpacing(!showLineSpacing)
            }}
          >
            <img src="/editor-icons/advance/line-height.svg" alt="Line Spacing" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showLineSpacing && isMounted && dropdownPositions.lineSpacing?.top > 0 && createPortal(
            <div className="line-spacing-picker fixed bg-white border rounded-md shadow-lg py-1 min-w-[100px]"
              style={{
                zIndex: 10001,
                top: `${dropdownPositions.lineSpacing?.top || 0}px`,
                left: `${dropdownPositions.lineSpacing?.left || 0}px`,
              }}
              onClick={(e) => e.stopPropagation()}>
              {['1', '1.15', '1.5', '2', '2.5', '3'].map((height) => (
                <button
                  key={height}
                  className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                  onClick={() => setLineHeight(height)}
                >
                  {height}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {/* Indent Buttons */}
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          <button
            onClick={increaseIndent}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Increase Indent"
          >
            <img src="/editor-icons/advance/increase-indent.svg" alt="Increase Indent" className="w-4 h-4" />
          </button>
          <button
            onClick={decreaseIndent}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0"
            title="Decrease Indent"
          >
            <img src="/editor-icons/advance/decrease-indent.svg" alt="Decrease Indent" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white" style={{ minHeight: '338px' }}>
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none"
        />
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false)
          onImageModalToggle?.(false)
        }}
        onImageAdd={handleImageAdd}
      />
    </div>
  )
}



