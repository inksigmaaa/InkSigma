import { ChevronDown, ChevronUp } from "lucide-react"
import { 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify 
} from "lucide-react"

export function EditorToolbar({
  font,
  applyFontFamily,
  applyHeading,
  applyFormat,
  showHeadingMenu,
  setShowHeadingMenu,
  showListMenu,
  setShowListMenu,
  showAlignMenu,
  setShowAlignMenu,
  showAdvancedOptions,
  setShowAdvancedOptions,
  showImageTooltip,
  setShowImageTooltip,
  onInsertImage,
  onInsertLink,
  closeAllDropdowns,
}) {
  const fonts = [
    "Arial", "Arial Black", "Brush Script MT", "Comic Sans MS", 
    "Courier New", "Garamond", "Georgia", "Helvetica", "Impact", 
    "Lucida Console", "Lucida Sans Unicode", "Palatino Linotype", 
    "Roboto", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"
  ]

  const cycleFontUp = () => {
    const currentIndex = fonts.indexOf(font)
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : fonts.length - 1
    applyFontFamily(fonts[nextIndex])
  }

  const cycleFontDown = () => {
    const currentIndex = fonts.indexOf(font)
    const nextIndex = currentIndex < fonts.length - 1 ? currentIndex + 1 : 0
    applyFontFamily(fonts[nextIndex])
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-200">
      {/* Font Selector */}
      <div className="relative flex items-center gap-1.5">
        <span className="text-base font-normal text-gray-700 w-[100px] truncate">{font}</span>
        <div className="flex flex-col -space-y-1">
          <button onClick={cycleFontUp} className="hover:bg-gray-100 rounded p-0.5">
            <ChevronUp className="h-3 w-3 text-gray-600" />
          </button>
          <button onClick={cycleFontDown} className="hover:bg-gray-100 rounded p-0.5">
            <ChevronDown className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="h-6 w-px bg-gray-300"></div>

      {/* Heading Selector */}
      <div className="flex items-center gap-2 dropdown-container">
        <img src="/editor-icons/P.svg" alt="P" />
        <div className="relative">
          <button
            className="flex items-center hover:bg-gray-100 rounded px-1"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!showHeadingMenu) closeAllDropdowns()
              setShowHeadingMenu(!showHeadingMenu)
            }}
          >
            <img src="/editor-icons/H.svg" alt="H" />
            <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[80px]">
              {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
                <button
                  key={heading}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyHeading(heading)
                    setShowHeadingMenu(false)
                  }}
                >
                  {heading}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-gray-300"></div>

      {/* Format Buttons */}
      <button onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-100 rounded" title="Bold">
        <img src="/editor-icons/B.svg" alt="Bold" />
      </button>
      <button onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-100 rounded" title="Italic">
        <img src="/editor-icons/italic.svg" alt="Italic" />
      </button>
      <button onClick={() => applyFormat('underline')} className="p-2 hover:bg-gray-100 rounded" title="Underline">
        <img src="/editor-icons/underline.svg" alt="Underline" />
      </button>
      <button onClick={() => applyFormat('strikeThrough')} className="p-2 hover:bg-gray-100 rounded" title="Strikethrough">
        <img src="/editor-icons/strike.svg" alt="Strikethrough" />
      </button>

      <div className="h-6 w-px bg-gray-300"></div>

      {/* List Button with Dropdown */}
      <div className="relative dropdown-container">
        <button 
          className="p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!showListMenu) closeAllDropdowns()
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
      <div className="relative dropdown-container">
        <button 
          className="p-2 hover:bg-gray-100 rounded flex items-center gap-0.5"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!showAlignMenu) closeAllDropdowns()
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
          onClick={onInsertImage}
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
      <div className="relative dropdown-container">
        <button 
          className="p-2 hover:bg-gray-100 rounded"
          onClick={onInsertLink}
          title="Insert Link"
        >
          <img src="/editor-icons/link.svg" alt="Link" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300"></div>

      <div className="relative dropdown-container">
        <button 
          className="text-sm text-gray-600 px-2 hover:text-gray-800"
          onClick={() => {
            if (!showAdvancedOptions) closeAllDropdowns()
            setShowAdvancedOptions(!showAdvancedOptions)
          }}
        >
          Advanced Options
        </button>

        {/* Advanced Options Dropdown */}
        {showAdvancedOptions && (
          <div className="absolute top-full right-0 mt-5 bg-white border border-gray-200 rounded-lg p-6 shadow-lg z-20 w-[300px]">
            <div className="space-y-4">
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
  )
}
