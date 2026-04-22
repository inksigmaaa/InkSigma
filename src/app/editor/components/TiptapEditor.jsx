"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { LineHeight } from "./extensions/LineHeight";
import { Indent } from "./extensions/Indent";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Loader2,
  Mic,
  Square,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { ImageModal } from "./ImageModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const FONT_OPTIONS = [
  "Arial",
  "Arial Black",
  "Brush Script MT",
  "Comic Sans MS",
  "Courier New",
  "Garamond",
  "Georgia",
  "Helvetica",
  "Impact",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Palatino Linotype",
  "Roboto",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const FONT_MAP = new Map(FONT_OPTIONS.map((font, index) => [font, index]));

const API_ORIGINS = [
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:5000",
]
  .filter(Boolean)
  .map((url) => String(url).replace(/\/$/, ""));

const createApiUrl = (relativePath) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
};

const VOICE_MAX_RECORDING_SECONDS = 300;
const VOICE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];
const VOICE_CONTENT_ONLY_MESSAGE =
  "Voice dictation is only for article content, not the title or short description.";

const getSupportedVoiceMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    VOICE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || ""
  );
};

const getVoiceFileExtension = (mimeType) => {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
};

const formatVoiceDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

const isTitleOrDescriptionFocused = () => {
  if (typeof document === "undefined") return false;
  const activeElement = document.activeElement;
  return Boolean(
    activeElement?.matches?.("input.title-input, input.desc-input"),
  );
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const textToEditorContent = (text) => {
  const normalized = text.trim();
  if (!normalized) return "";

  if (!/\n/.test(normalized)) {
    return escapeHtml(normalized);
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const normalizeImageUrl = (url, forStorage = false) => {
  if (!url) return url;

  if (forStorage) {
    // Cloudinary URLs are already absolute and should be stored as-is
    if (url.includes("res.cloudinary.com")) return url;

    for (const origin of API_ORIGINS) {
      if (url.startsWith(origin)) {
        const path = url.substring(origin.length) || "/";
        return path.startsWith("/") ? path : `/${path}`;
      }
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.host.endsWith(":5000")) {
        return `${parsedUrl.pathname}${parsedUrl.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return createApiUrl(url);
};

const processEditorContent = (content, normalizeFn) => {
  if (!content) return content;
  return content.replace(/src="([^"]*)"/g, (match, src) => {
    if (!src) return match;
    const normalized = normalizeFn(src);
    return `src="${normalized}"`;
  });
};

const Tooltip = ({ text, children, className = "" }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <ShadTooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex ${className}`}>{children}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-[10000]">
          {text}
        </TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
  );
};

const DropdownMenu = ({
  isOpen,
  position,
  onClose,
  children,
  className = "",
}) => {
  const mounted = typeof window !== "undefined";

  if (!isOpen || !mounted || position.top === undefined || position.top === null)
    return null;

  return createPortal(
    <div
      className={`tiptap-dropdown fixed bg-white border rounded-md shadow-xl py-1 border-gray-300 ${className}`}
      style={{
        zIndex: 9999,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

const getToolbarActiveState = (editor) => ({
  bold: editor?.isActive("bold") ?? false,
  italic: editor?.isActive("italic") ?? false,
  underline: editor?.isActive("underline") ?? false,
  strike: editor?.isActive("strike") ?? false,
  codeBlock: editor?.isActive("codeBlock") ?? false,
  blockquote: editor?.isActive("blockquote") ?? false,
  superscript: editor?.isActive("superscript") ?? false,
  subscript: editor?.isActive("subscript") ?? false,
});

const isSameToolbarState = (prev, next) =>
  prev.bold === next.bold &&
  prev.italic === next.italic &&
  prev.underline === next.underline &&
  prev.strike === next.strike &&
  prev.codeBlock === next.codeBlock &&
  prev.blockquote === next.blockquote &&
  prev.superscript === next.superscript &&
  prev.subscript === next.subscript;

const useToolbarActiveState = (editor) => {
  const [activeState, setActiveState] = useState(() =>
    getToolbarActiveState(editor),
  );

  useEffect(() => {
    if (!editor) return;

    const updateActiveState = () => {
      setActiveState((prev) => {
        const next = getToolbarActiveState(editor);
        return isSameToolbarState(prev, next) ? prev : next;
      });
    };

    updateActiveState();

    editor.on("selectionUpdate", updateActiveState);
    editor.on("transaction", updateActiveState);
    editor.on("focus", updateActiveState);
    editor.on("blur", updateActiveState);

    return () => {
      editor.off("selectionUpdate", updateActiveState);
      editor.off("transaction", updateActiveState);
      editor.off("focus", updateActiveState);
      editor.off("blur", updateActiveState);
    };
  }, [editor]);

  return activeState;
};

const EditorToolbar = ({
  editor,
  currentFont,
  onFontChange,
  onDropdownToggle,
  dropdownState,
  linkState,
  onLinkSubmit,
  onLinkCancel,
  onImageInsert,
}) => {
  const activeState = useToolbarActiveState(editor);
  const buttonBaseClass = "p-1.5 rounded shrink-0 shadow-none";
  const buttonActiveClass = (isActive) =>
    isActive
      ? "bg-gray-200 hover:bg-gray-200 shadow-none"
      : "hover:bg-gray-100";

  const handleMouseDown = (e) => {
    e.preventDefault();
  };

  const headingOptions = ["H1", "H2", "H3", "H4", "H5", "H6"];
  const lineHeightOptions = ["1", "1.15", "1.5", "2", "2.5", "3"];

  const formatButtons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: activeState.bold,
      icon: "B",
      title: "Bold",
      src: "/editor-icons/B.svg",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: activeState.italic,
      icon: "I",
      title: "Italic",
      src: "/editor-icons/italic.svg",
    },
    {
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: activeState.underline,
      icon: "U",
      title: "Underline",
      src: "/editor-icons/underline.svg",
    },
    {
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: activeState.strike,
      icon: "S",
      title: "Strikethrough",
      src: "/editor-icons/strike.svg",
    },
  ];

  const insertButtons = [
    {
      action: () => onImageInsert?.(),
      title: "Insert Image",
      src: "/editor-icons/image.svg",
    },
    {
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: activeState.codeBlock,
      title: "Code Block",
      src: "/editor-icons/block.svg",
    },
    {
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: activeState.blockquote,
      title: "Quote",
      src: "/editor-icons/quote.svg",
    },
  ];

  return (
    <>
      {/* Desktop Toolbar */}
      <div
        className="hidden xl:flex items-center gap-1 md:gap-2 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full xl:max-w-[917px]"
        style={{ height: "52px", borderBottom: "1px solid #E5E7EB" }}
      >
        <FontSelector currentFont={currentFont} onFontChange={onFontChange} />

        <HeadingSelector
          editor={editor}
          isOpen={dropdownState.heading.isOpen}
          position={dropdownState.heading.position}
          onToggle={(e) => onDropdownToggle("heading", e)}
          onClose={() => onDropdownToggle("heading", null)}
          onSelect={(level) => {
            editor.chain().focus().setParagraph().run();
            if (level !== "P") {
              const levelNum = parseInt(level.replace("H", ""));
              editor.chain().focus().toggleHeading({ level: levelNum }).run();
            }
            onDropdownToggle("heading", null);
          }}
          dropdownKey="heading"
        />

        <FormatButtons
          buttons={formatButtons}
          buttonBaseClass={buttonBaseClass}
          buttonActiveClass={buttonActiveClass}
        />

        <ListSelector
          editor={editor}
          isOpen={dropdownState.list.isOpen}
          position={dropdownState.list.position}
          onToggle={(e) => onDropdownToggle("list", e)}
          onClose={() => onDropdownToggle("list", null)}
          dropdownKey="list"
        />

        <AlignSelector
          editor={editor}
          isOpen={dropdownState.align.isOpen}
          position={dropdownState.align.position}
          onToggle={(e) => onDropdownToggle("align", e)}
          onClose={() => onDropdownToggle("align", null)}
          dropdownKey="align"
        />

        <InsertButtons
          buttons={insertButtons}
          buttonBaseClass={buttonBaseClass}
          buttonActiveClass={buttonActiveClass}
        />

        <LinkButton
          editor={editor}
          isOpen={dropdownState.link.isOpen}
          position={dropdownState.link.position}
          onToggle={(e) => onDropdownToggle("link", e)}
          onClose={() => onDropdownToggle("link", null)}
          linkState={linkState}
          onLinkSubmit={onLinkSubmit}
          onLinkCancel={onLinkCancel}
          dropdownKey="link"
        />

        <AdvancedOptions
          editor={editor}
          isOpen={dropdownState.advanced.isOpen}
          position={dropdownState.advanced.position}
          onToggle={(e) => onDropdownToggle("advanced", e)}
          onClose={() => onDropdownToggle("advanced", null)}
          dropdownKey="advanced"
        />
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar
        editor={editor}
        currentFont={currentFont}
        onDropdownToggle={onDropdownToggle}
        dropdownState={dropdownState}
        linkState={linkState}
        onLinkSubmit={onLinkSubmit}
        onLinkCancel={onLinkCancel}
        buttonBaseClass={buttonBaseClass}
        buttonActiveClass={buttonActiveClass}
        onImageInsert={onImageInsert}
        activeState={activeState}
      />

      {/* Tablet Toolbar */}
      <TabletToolbar
        editor={editor}
        onDropdownToggle={onDropdownToggle}
        dropdownState={dropdownState}
        onImageInsert={onImageInsert}
        activeState={activeState}
      />
    </>
  );
};

const FontSelector = ({ currentFont, onFontChange }) => {
  const cycleFont = useCallback(
    (direction) => {
      const currentIndex = FONT_MAP.get(currentFont) ?? 0;
      const newIndex =
        direction === "up"
          ? currentIndex > 0
            ? currentIndex - 1
            : FONT_OPTIONS.length - 1
          : currentIndex < FONT_OPTIONS.length - 1
            ? currentIndex + 1
            : 0;
      onFontChange(FONT_OPTIONS[newIndex]);
    },
    [currentFont, onFontChange],
  );

  return (
    <div className="relative flex items-center gap-1 shrink-0 pr-2 border-r border-gray-200">
      <span className="text-sm font-normal text-gray-700 w-[70px] truncate">
        {currentFont}
      </span>
      <div className="flex flex-col -space-y-1">
        <button
          onClick={() => cycleFont("up")}
          className="hover:bg-gray-100 rounded p-0.5"
        >
          <ChevronUp className="h-3 w-3 text-gray-600" />
        </button>
        <button
          onClick={() => cycleFont("down")}
          className="hover:bg-gray-100 rounded p-0.5"
        >
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

const HeadingSelector = ({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  onSelect,
  dropdownKey,
}) => {
  const headings = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];

  return (
    <div
      className="flex items-center gap-1 dropdown-container shrink-0 px-1 border-r border-gray-200"
      data-key={dropdownKey}
    >
      <Tooltip text="Paragraph">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 hover:bg-gray-100 rounded ${editor.isActive("paragraph") ? "bg-gray-200" : ""}`}
        >
          <img src="/editor-icons/P.svg" alt="P" className="w-4 h-4" />
        </button>
      </Tooltip>
      <div className="relative">
        <button
          type="button"
          className="flex items-center hover:bg-gray-100 rounded px-1 py-1.5"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isOpen ? onClose() : onToggle(e);
          }}
        >
          <img src="/editor-icons/H.svg" alt="H" className="w-5 h-5" />
          <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
        </button>
        <DropdownMenu
          isOpen={isOpen}
          position={position}
          className="min-w-[80px]"
          onClose={onClose}
        >
          {headings.map((heading) => (
            <button
              type="button"
              key={heading}
              className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(heading);
              }}
            >
              {heading}
            </button>
          ))}
        </DropdownMenu>
      </div>
    </div>
  );
};

const FormatButtons = ({ buttons, buttonBaseClass, buttonActiveClass }) => {
  const [clickedState, setClickedState] = useState({});

  return (
    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
      {buttons.map((btn, idx) => {
        const isActive = Boolean(btn.isActive || clickedState[idx]);

        return (
          <Tooltip key={idx} text={btn.title}>
            <button
              type="button"
              aria-pressed={isActive}
              onMouseDown={(e) => {
                e.preventDefault();
                btn.action();
                if (typeof btn.isActive === "boolean") {
                  setClickedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
                }
              }}
              className={`${buttonBaseClass} ${buttonActiveClass(isActive)}`}
              style={isActive ? { backgroundColor: "#E5E7EB" } : undefined}
            >
              <img src={btn.src} alt={btn.title} className="w-4 h-4" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

const InsertButtons = ({ buttons, buttonBaseClass, buttonActiveClass }) => {
  const [clickedState, setClickedState] = useState({});

  return (
    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
      {buttons.map((btn, idx) => {
        const isActive = Boolean(btn.isActive || clickedState[idx]);

        return (
          <Tooltip key={idx} text={btn.title}>
            <button
              type="button"
              aria-pressed={isActive}
              onMouseDown={(e) => {
                e.preventDefault();
                btn.action();
                if (typeof btn.isActive === "boolean") {
                  setClickedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
                }
              }}
              className={`${buttonBaseClass} ${buttonActiveClass(isActive)}`}
              style={isActive ? { backgroundColor: "#E5E7EB" } : undefined}
            >
              <img src={btn.src} alt={btn.title} className="w-4 h-4" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

const ListSelector = ({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  dropdownKey,
}) => (
  <div
    className="relative dropdown-container shrink-0 px-1 border-r border-gray-200"
    data-key={dropdownKey}
  >
    <Tooltip text="Lists">
      <button
        type="button"
        className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isOpen ? onClose() : onToggle(e);
        }}
      >
        <img src="/editor-icons/list.svg" alt="Lists" className="w-4 h-4" />
        <ChevronDown className="h-3 w-3 text-gray-700" />
      </button>
    </Tooltip>
    <DropdownMenu
      isOpen={isOpen}
      position={position}
      className="min-w-[150px]"
      onClose={onClose}
    >
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
          onClose();
        }}
      >
        <List className="h-4 w-4" /> Bullet List
      </button>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
          onClose();
        }}
      >
        <ListOrdered className="h-4 w-4" /> Numbered List
      </button>
    </DropdownMenu>
  </div>
);

const AlignSelector = ({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  dropdownKey,
}) => {
  const alignOptions = [
    { align: "left", icon: AlignLeft, label: "Align Left" },
    { align: "center", icon: AlignCenter, label: "Align Center" },
    { align: "right", icon: AlignRight, label: "Align Right" },
    { align: "justify", icon: AlignJustify, label: "Justify" },
  ];

  return (
    <div
      className="relative dropdown-container shrink-0 px-1 border-r border-gray-200"
      data-key={dropdownKey}
    >
      <Tooltip text="Alignment">
        <button
          type="button"
          className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isOpen ? onClose() : onToggle(e);
          }}
        >
          <img
            src="/editor-icons/Paragraph.svg"
            alt="Alignment"
            className="w-4 h-4"
          />
          <ChevronDown className="h-3 w-3 text-gray-700" />
        </button>
      </Tooltip>
      <DropdownMenu
        isOpen={isOpen}
        position={position}
        className="min-w-[150px]"
        onClose={onClose}
      >
        {alignOptions.map((opt) => (
          <button
            type="button"
            key={opt.align}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign(opt.align).run();
              onClose();
            }}
          >
            <opt.icon className="h-4 w-4" /> {opt.label}
          </button>
        ))}
      </DropdownMenu>
    </div>
  );
};

const LinkButton = ({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  linkState,
  onLinkSubmit,
  onLinkCancel,
  dropdownKey,
}) => (
  <div className="relative dropdown-container shrink-0" data-key={dropdownKey}>
    <Tooltip text="Insert Link">
      <button
        type="button"
        className="p-1.5 hover:bg-gray-100 rounded"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, "");
          onToggle(null, text);
        }}
      >
        <img src="/editor-icons/link.svg" alt="Link" className="w-4 h-4" />
      </button>
    </Tooltip>
    <DropdownMenu
      isOpen={isOpen}
      position={position}
      className="min-w-[250px] p-3"
      onClose={onClose}
    >
      <input
        type="text"
        placeholder="Enter URL"
        value={linkState.url}
        onChange={(e) => linkState.setUrl(e.target.value)}
        className="w-full px-2 py-1 border rounded text-sm mb-2"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onLinkCancel}
          className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onLinkSubmit}
          className="px-3 py-1 text-sm bg-black text-white rounded hover:opacity-90"
        >
          Add Link
        </button>
      </div>
    </DropdownMenu>
  </div>
);

const AdvancedOptions = ({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  dropdownKey,
}) => {
  const handleLineHeight = (height) => {
    editor.chain().focus().setLineHeight(height).run();
    onClose();
  };
  const lineHeights = ["1", "1.15", "1.5", "2", "2.5", "3"];

  return (
    <div
      className="relative dropdown-container shrink-0"
      data-key={dropdownKey}
    >
      <button
        type="button"
        className="text-sm text-gray-600 px-3 py-1.5 hover:bg-gray-200 rounded whitespace-nowrap"
        style={{ backgroundColor: "#F8F8F8" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isOpen ? onClose() : onToggle(e, { alignRight: true, width: 300 });
        }}
      >
        Advanced Options
      </button>
      <DropdownMenu
        isOpen={isOpen}
        position={position}
        className="min-w-[300px] p-3"
        onClose={onClose}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 w-20">Script:</span>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleSuperscript().run();
              onClose();
            }}
            className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor.isActive("superscript") ? "bg-gray-200" : ""}`}
          >
            <img
              src="/editor-icons/advance/super.svg"
              alt="Superscript"
              className="w-4 h-4"
            />{" "}
            Superscript
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleSubscript().run();
              onClose();
            }}
            className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor.isActive("subscript") ? "bg-gray-200" : ""}`}
          >
            <img
              src="/editor-icons/advance/sub.svg"
              alt="Subscript"
              className="w-4 h-4"
            />{" "}
            Subscript
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 w-20">Line Height:</span>
          <div className="flex gap-1">
            {lineHeights.map((h) => (
              <button
                type="button"
                key={h}
                className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
                onClick={() => handleLineHeight(h)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-20">Indent:</span>
          <button
            type="button"
            onClick={() => {
              editor.isActive("listItem")
                ? editor.chain().focus().sinkListItem("listItem").run()
                : editor.chain().focus().indent().run();
              onClose();
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
          >
            <img
              src="/editor-icons/advance/increase-indent.svg"
              alt="Increase"
              className="w-4 h-4"
            />{" "}
            Increase
          </button>
          <button
            type="button"
            onClick={() => {
              editor.isActive("listItem")
                ? editor.chain().focus().liftListItem("listItem").run()
                : editor.chain().focus().outdent().run();
              onClose();
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
          >
            <img
              src="/editor-icons/advance/decrease-indent.svg"
              alt="Decrease"
              className="w-4 h-4"
            />{" "}
            Decrease
          </button>
        </div>
      </DropdownMenu>
    </div>
  );
};

const MobileToolbar = ({
  editor,
  currentFont,
  onDropdownToggle,
  dropdownState,
  linkState,
  onLinkSubmit,
  onLinkCancel,
  buttonBaseClass,
  buttonActiveClass,
  onImageInsert,
  activeState,
}) => {
  const headingOptions = ["H1", "H2", "H3", "H4", "H5", "H6"];
  const lineHeightOptions = ["1", "1.15", "1.5", "2", "2.5", "3"];

  return (
    <div
      className="flex md:hidden items-center gap-1 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full"
      style={{
        height: "52px",
        borderBottom: "1px solid #E5E7EB",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-gray-200">
        <span className="text-sm font-normal text-gray-700 w-[70px] truncate">
          {currentFont}
        </span>
      </div>

      <div className="flex items-center gap-1 dropdown-container shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Paragraph">
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 hover:bg-gray-100 rounded ${editor.isActive("paragraph") ? "bg-gray-200" : ""}`}
          >
            <img src="/editor-icons/P.svg" alt="P" className="w-4 h-4" />
          </button>
        </Tooltip>
        <div className="relative">
          <button
            type="button"
            className="flex items-center hover:bg-gray-100 rounded px-1 py-1.5"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropdownToggle("heading", e);
            }}
          >
            <img src="/editor-icons/H.svg" alt="H" className="w-5 h-5" />
            <ChevronDown className="h-3 w-3 text-gray-600 ml-0.5" />
          </button>
          <DropdownMenu
            isOpen={dropdownState.heading.isOpen}
            position={dropdownState.heading.position}
            className="min-w-[80px]"
          >
            {headingOptions.map((h) => (
              <button
                key={h}
                className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm font-medium"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (h === "P") {
                    editor.chain().focus().setParagraph().run();
                  } else {
                    const level = parseInt(h.replace("H", ""));
                    editor.chain().focus().toggleHeading({ level }).run();
                  }
                  onDropdownToggle("heading", null);
                }}
              >
                {h}
              </button>
            ))}
          </DropdownMenu>
        </div>
      </div>

      <FormatButtons
        buttons={[
          {
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: activeState.bold,
            title: "Bold",
            src: "/editor-icons/B.svg",
          },
          {
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: activeState.italic,
            title: "Italic",
            src: "/editor-icons/italic.svg",
          },
          {
            action: () => editor.chain().focus().toggleUnderline().run(),
            isActive: activeState.underline,
            title: "Underline",
            src: "/editor-icons/underline.svg",
          },
          {
            action: () => editor.chain().focus().toggleStrike().run(),
            isActive: activeState.strike,
            title: "Strikethrough",
            src: "/editor-icons/strike.svg",
          },
        ]}
        buttonBaseClass={buttonBaseClass}
        buttonActiveClass={buttonActiveClass}
      />

      <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Lists">
          <button
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault();
              onDropdownToggle("list", e);
            }}
          >
            <img src="/editor-icons/list.svg" alt="Lists" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
        </Tooltip>
        <DropdownMenu
          isOpen={dropdownState.list.isOpen}
          position={dropdownState.list.position}
          className="min-w-[150px]"
        >
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
              onDropdownToggle("list", null);
            }}
          >
            <List className="h-4 w-4" /> Bullet List
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
              onDropdownToggle("list", null);
            }}
          >
            <ListOrdered className="h-4 w-4" /> Numbered List
          </button>
        </DropdownMenu>
      </div>

      <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Alignment">
          <button
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault();
              onDropdownToggle("align", e);
            }}
          >
            <img
              src="/editor-icons/Paragraph.svg"
              alt="Alignment"
              className="w-4 h-4"
            />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
        </Tooltip>
        <DropdownMenu
          isOpen={dropdownState.align.isOpen}
          position={dropdownState.align.position}
          className="min-w-[150px]"
        >
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("left").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignLeft className="h-4 w-4" /> Align Left
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("center").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignCenter className="h-4 w-4" /> Align Center
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("right").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignRight className="h-4 w-4" /> Align Right
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("justify").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignJustify className="h-4 w-4" /> Justify
          </button>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
        <Tooltip text="Insert Image">
          <button
            className="p-1.5 hover:bg-gray-100 rounded"
            onClick={() => onImageInsert?.()}
          >
            <img
              src="/editor-icons/image.svg"
              alt="Image"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
        <Tooltip text="Code Block">
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${buttonBaseClass} ${buttonActiveClass(activeState.codeBlock)}`}
          >
            <img
              src="/editor-icons/block.svg"
              alt="Code Block"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
        <Tooltip text="Quote">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${buttonBaseClass} ${buttonActiveClass(activeState.blockquote)}`}
          >
            <img src="/editor-icons/quote.svg" alt="Quote" className="w-4 h-4" />
          </button>
        </Tooltip>
        <LinkButton
          editor={editor}
          isOpen={dropdownState.link.isOpen}
          position={dropdownState.link.position}
          onToggle={(e, text) => onDropdownToggle("link", e, text)}
          onClose={() => onDropdownToggle("link", null)}
          linkState={linkState}
          onLinkSubmit={onLinkSubmit}
          onLinkCancel={onLinkCancel}
        />
      </div>

      <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 shrink-0">
        <Tooltip text="Superscript">
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`${buttonBaseClass} ${buttonActiveClass(activeState.superscript)}`}
          >
            <img
              src="/editor-icons/advance/super.svg"
              alt="Superscript"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
        <Tooltip text="Subscript">
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`${buttonBaseClass} ${buttonActiveClass(activeState.subscript)}`}
          >
            <img
              src="/editor-icons/advance/sub.svg"
              alt="Subscript"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
      </div>

      <div className="relative shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Line Spacing">
          <button
            className="flex items-center gap-0.5 p-1.5 hover:bg-gray-100 rounded shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              onDropdownToggle("lineSpacing", e);
            }}
          >
            <img
              src="/editor-icons/advance/line-height.svg"
              alt="Line Spacing"
              className="w-4 h-4"
            />
            <ChevronDown className="h-3 w-3" />
          </button>
        </Tooltip>
        <DropdownMenu
          isOpen={dropdownState.lineSpacing.isOpen}
          position={dropdownState.lineSpacing.position}
          className="min-w-[100px]"
        >
          {lineHeightOptions.map((h) => (
            <button
              key={h}
              className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setLineHeight(h).run();
                onDropdownToggle("lineSpacing", null);
              }}
            >
              {h}
            </button>
          ))}
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-0.5 px-1 shrink-0">
        <Tooltip text="Increase Indent">
          <button
            onClick={() =>
              editor.isActive("listItem")
                ? editor.chain().focus().sinkListItem("listItem").run()
                : editor.chain().focus().indent().run()
            }
            className={`${buttonBaseClass}`}
          >
            <img
              src="/editor-icons/advance/increase-indent.svg"
              alt="Increase Indent"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
        <Tooltip text="Decrease Indent">
          <button
            onClick={() =>
              editor.isActive("listItem")
                ? editor.chain().focus().liftListItem("listItem").run()
                : editor.chain().focus().outdent().run()
            }
            className={`${buttonBaseClass}`}
          >
            <img
              src="/editor-icons/advance/decrease-indent.svg"
              alt="Decrease Indent"
              className="w-4 h-4"
            />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const TabletToolbar = ({
  editor,
  onDropdownToggle,
  dropdownState,
  onImageInsert,
  activeState,
}) => {
  const headings = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];

  const getHeadingLabel = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) return `Heading ${i}`;
    }
    return "Normal text";
  };

  return (
    <div
      className="hidden md:flex xl:hidden items-center gap-1 md:gap-2 px-4 bg-white overflow-x-auto scrollbar-hide whitespace-nowrap w-full"
      style={{
        height: "52px",
        borderBottom: "1px solid #E5E7EB",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex items-center gap-0.5 shrink-0 pr-2 border-r border-gray-200">
        <Tooltip text="Undo">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
        </Tooltip>
        <Tooltip text="Redo">
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 hover:bg-gray-100 rounded shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
        </Tooltip>
      </div>

      <div className="relative dropdown-container shrink-0 pr-2 border-r border-gray-200">
        <button
          className="flex items-center hover:bg-gray-100 rounded px-2 py-1.5 text-sm"
          onMouseDown={(e) => {
            e.preventDefault();
            onDropdownToggle("heading", e);
          }}
        >
          <span className="text-gray-700">{getHeadingLabel()}</span>
          <ChevronDown className="h-3 w-3 text-gray-600 ml-1" />
        </button>
        <DropdownMenu
          isOpen={dropdownState.heading.isOpen}
          position={dropdownState.heading.position}
          className="min-w-[140px]"
        >
          {headings.map((h) => (
            <button
              key={h}
              className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                if (h === "P") {
                  editor.chain().focus().setParagraph().run();
                } else {
                  const level = parseInt(h.replace("H", ""));
                  editor.chain().focus().toggleHeading({ level }).run();
                }
                onDropdownToggle("heading", null);
              }}
            >
              {h === "P" ? "Normal text" : h}
            </button>
          ))}
        </DropdownMenu>
      </div>

      <FormatButtons
        buttons={[
          {
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: activeState.bold,
            title: "Bold",
            src: "/editor-icons/B.svg",
          },
          {
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: activeState.italic,
            title: "Italic",
            src: "/editor-icons/italic.svg",
          },
          {
            action: () => editor.chain().focus().toggleUnderline().run(),
            isActive: activeState.underline,
            title: "Underline",
            src: "/editor-icons/underline.svg",
          },
          {
            action: () => editor.chain().focus().toggleStrike().run(),
            isActive: activeState.strike,
            title: "Strikethrough",
            src: "/editor-icons/strike.svg",
          },
        ]}
        buttonBaseClass="p-1.5 hover:bg-gray-100 rounded shrink-0"
        buttonActiveClass={(isActive) => (isActive ? "bg-gray-200" : "")}
      />

      <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Lists">
          <button
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault();
              onDropdownToggle("list", e);
            }}
          >
            <img src="/editor-icons/list.svg" alt="Lists" className="w-4 h-4" />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
        </Tooltip>
        <DropdownMenu
          isOpen={dropdownState.list.isOpen}
          position={dropdownState.list.position}
          className="min-w-[150px]"
        >
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
              onDropdownToggle("list", null);
            }}
          >
            <List className="h-4 w-4" /> Bullet List
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
              onDropdownToggle("list", null);
            }}
          >
            <ListOrdered className="h-4 w-4" /> Numbered List
          </button>
        </DropdownMenu>
      </div>

      <div className="relative dropdown-container shrink-0 px-1 border-r border-gray-200">
        <Tooltip text="Alignment">
          <button
            className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-0.5"
            onMouseDown={(e) => {
              e.preventDefault();
              onDropdownToggle("align", e);
            }}
          >
            <img
              src="/editor-icons/Paragraph.svg"
              alt="Alignment"
              className="w-4 h-4"
            />
            <ChevronDown className="h-3 w-3 text-gray-700" />
          </button>
        </Tooltip>
        <DropdownMenu
          isOpen={dropdownState.align.isOpen}
          position={dropdownState.align.position}
          className="min-w-[150px]"
        >
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("left").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignLeft className="h-4 w-4" /> Align Left
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("center").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignCenter className="h-4 w-4" /> Align Center
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("right").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignRight className="h-4 w-4" /> Align Right
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-sm"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("justify").run();
              onDropdownToggle("align", null);
            }}
          >
            <AlignJustify className="h-4 w-4" /> Justify
          </button>
        </DropdownMenu>
      </div>

      <InsertButtons
        buttons={[
          {
            action: () => onImageInsert?.(),
            title: "Insert Image",
            src: "/editor-icons/image.svg",
          },
          {
            action: () => editor.chain().focus().toggleCodeBlock().run(),
            isActive: activeState.codeBlock,
            title: "Code Block",
            src: "/editor-icons/block.svg",
          },
          {
            action: () => editor.chain().focus().toggleBlockquote().run(),
            isActive: activeState.blockquote,
            title: "Quote",
            src: "/editor-icons/quote.svg",
          },
        ]}
        buttonBaseClass="p-1.5 hover:bg-gray-100 rounded shrink-0"
        buttonActiveClass={(isActive) => (isActive ? "bg-gray-200" : "")}
      />

      <div className="relative dropdown-container shrink-0">
        <button
          className="text-sm text-gray-600 px-3 py-1.5 hover:bg-gray-200 rounded whitespace-nowrap"
          style={{ backgroundColor: "#F8F8F8" }}
          onClick={(e) => {
            e.preventDefault();
            onDropdownToggle("advanced", e, { alignRight: true, width: 300 });
          }}
        >
          Advanced
        </button>
        <DropdownMenu
          isOpen={dropdownState.advanced.isOpen}
          position={dropdownState.advanced.position}
          className="min-w-[300px] p-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 w-20">Script:</span>
            <button
              onClick={() => {
                editor.chain().focus().toggleSuperscript().run();
                onDropdownToggle("advanced", null);
              }}
              className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor.isActive("superscript") ? "bg-gray-200" : ""}`}
            >
              <img
                src="/editor-icons/advance/super.svg"
                alt="Superscript"
                className="w-4 h-4"
              />{" "}
              Superscript
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleSubscript().run();
                onDropdownToggle("advanced", null);
              }}
              className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm ${editor.isActive("subscript") ? "bg-gray-200" : ""}`}
            >
              <img
                src="/editor-icons/advance/sub.svg"
                alt="Subscript"
                className="w-4 h-4"
              />{" "}
              Subscript
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 w-20">Line Height:</span>
            <div className="flex gap-1">
              {["1", "1.15", "1.5", "2", "2.5", "3"].map((h) => (
                <button
                  key={h}
                  className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
                  onClick={() => {
                    editor.chain().focus().setLineHeight(h).run();
                    onDropdownToggle("advanced", null);
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Indent:</span>
            <button
              onClick={() => {
                editor.isActive("listItem")
                  ? editor.chain().focus().sinkListItem("listItem").run()
                  : editor.chain().focus().indent().run();
                onDropdownToggle("advanced", null);
              }}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
            >
              <img
                src="/editor-icons/advance/increase-indent.svg"
                alt="Increase"
                className="w-4 h-4"
              />{" "}
              Increase
            </button>
            <button
              onClick={() => {
                editor.isActive("listItem")
                  ? editor.chain().focus().liftListItem("listItem").run()
                  : editor.chain().focus().outdent().run();
                onDropdownToggle("advanced", null);
              }}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
            >
              <img
                src="/editor-icons/advance/decrease-indent.svg"
                alt="Decrease"
                className="w-4 h-4"
              />{" "}
              Decrease
            </button>
          </div>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const TiptapEditor = memo(function TiptapEditor({
  onUpdate,
  initialContent = "",
  onImageModalToggle,
  editorRef: externalEditorRef,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentFont, setCurrentFont] = useState("Roboto");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [aiToolbar, setAiToolbar] = useState({
    visible: false,
    top: 0,
    left: 0,
    text: "",
    range: null,
  });
  const [aiState, setAiState] = useState("idle");
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const dropdownKeys = [
    "heading",
    "list",
    "align",
    "advanced",
    "link",
    "lineSpacing",
    "color",
  ];

  const [dropdownState, setDropdownState] = useState(() => {
    const initial = {};
    dropdownKeys.forEach((key) => {
      initial[key] = { isOpen: false, position: { top: 0, left: 0 } };
    });
    return initial;
  });

  const [linkState, setLinkState] = useState({
    url: "",
    text: "",
    setUrl: (v) => setLinkState((prev) => ({ ...prev, url: v })),
    setText: (v) => setLinkState((prev) => ({ ...prev, text: v })),
  });

  const initialContentSetRef = useRef(false);
  const editorRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const shouldTranscribeRecordingRef = useRef(false);
  const voiceAbortControllerRef = useRef(null);
  const aiAbortControllerRef = useRef(null);
  const suppressNextVoiceClickRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setDropdownState((prev) => {
      const updated = { ...prev };
      dropdownKeys.forEach((key) => {
        updated[key] = { ...updated[key], isOpen: false };
      });
      return updated;
    });
  }, []);

  const handleDropdownToggle = useCallback((key, event, options = {}) => {
    setDropdownState((prev) => {
      const current = prev[key];
      const willOpen = !current.isOpen;

      const updated = { ...prev };

      // Close all other dropdowns first
      dropdownKeys.forEach((k) => {
        if (k !== key) {
          updated[k] = {
            ...updated[k],
            isOpen: false,
            position: { top: 0, left: 0 },
          };
        }
      });

      if (willOpen) {
        // Opening dropdown - find position from dropdown container
        const container = document.querySelector(
          `.dropdown-container[data-key="${key}"]`,
        );
        if (container) {
          const rect = container.getBoundingClientRect();
          updated[key] = {
            isOpen: true,
            position: {
              top: rect.bottom + 4,
              left: rect.left,
            },
          };
        } else {
          // Fallback
          updated[key] = {
            isOpen: true,
            position: current.position || { top: 0, left: 0 },
          };
        }
      } else {
        // Closing the dropdown
        updated[key] = { ...current, isOpen: false };
      }

      return updated;
    });
  }, []);

  const handleLinkSubmit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !linkState.url.trim()) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "");

    if (selectedText) {
      editor.chain().focus().setLink({ href: linkState.url.trim() }).run();
    } else {
      const textToInsert = linkState.text.trim() || linkState.url.trim();
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkState.url.trim()}">${textToInsert}</a>`)
        .run();
    }

    setLinkState({
      url: "",
      text: "",
      setUrl: (v) => setLinkState((prev) => ({ ...prev, url: v })),
      setText: (v) => setLinkState((prev) => ({ ...prev, text: v })),
    });
    handleDropdownToggle("link", null);
  }, [linkState, handleDropdownToggle]);

  const handleLinkCancel = useCallback(() => {
    setLinkState({
      url: "",
      text: "",
      setUrl: (v) => setLinkState((prev) => ({ ...prev, url: v })),
      setText: (v) => setLinkState((prev) => ({ ...prev, text: v })),
    });
    handleDropdownToggle("link", null);
  }, [handleDropdownToggle]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Superscript,
      Subscript,
      TextStyle,
      Color,
      LineHeight.configure({ types: ["paragraph", "heading"] }),
      Indent.configure({ types: ["paragraph", "heading"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-md" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: initialContent,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const processedHtml = processEditorContent(html, (url) =>
        normalizeImageUrl(url, true),
      );
      onUpdate?.({
        html: processedHtml,
        text,
        charCount: text.length,
        wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      });
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
      // Expose editor instance to parent via ref (for uncontrolled reads)
      if (externalEditorRef) externalEditorRef.current = ed;
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[300px] md:min-h-[400px] text-base md:text-lg text-gray-700 p-4",
        style: `font-family: ${currentFont}, sans-serif;`,
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && !initialContentSetRef.current) {
      const processedContent = processEditorContent(
        initialContent,
        normalizeImageUrl,
      );
      if (editor.getHTML() !== processedContent) {
        editor.commands.setContent(processedContent);
        initialContentSetRef.current = true;
      }
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      const { view } = editor;
      // eslint-disable-next-line react-hooks/immutability
      view.dom.style.fontFamily = `${currentFont}, sans-serif`;
    }
  }, [editor, currentFont]);

  useEffect(() => {
    if (!editor) return;

    const updateAiToolbar = () => {
      if (aiState === "loading") {
        return;
      }

      if (aiSuggestion) {
        setAiToolbar((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
        return;
      }

      const { from, to, empty } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, "\n\n").trim();

      if (empty || !selectedText) {
        setAiToolbar((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
        return;
      }

      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const toolbarWidth = 180;
        const left = Math.min(
          Math.max((start.left + end.right) / 2 - toolbarWidth / 2, 12),
          window.innerWidth - toolbarWidth - 12,
        );
        const top = Math.max(Math.min(start.top, end.top) - 52, 12);

        setAiToolbar({
          visible: true,
          top,
          left,
          text: selectedText,
          range: { from, to },
        });
      } catch {
        setAiToolbar((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
      }
    };

    updateAiToolbar();
    editor.on("selectionUpdate", updateAiToolbar);
    editor.on("transaction", updateAiToolbar);
    window.addEventListener("scroll", updateAiToolbar, true);
    window.addEventListener("resize", updateAiToolbar);

    return () => {
      editor.off("selectionUpdate", updateAiToolbar);
      editor.off("transaction", updateAiToolbar);
      window.removeEventListener("scroll", updateAiToolbar, true);
      window.removeEventListener("resize", updateAiToolbar);
    };
  }, [aiState, aiSuggestion, editor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isAnyOpen = Object.values(dropdownState).some((d) => d.isOpen);
      if (!isAnyOpen) return;

      const target = event.target;

      // Check if click is inside any dropdown element
      const isInside =
        target.closest(".dropdown-container") ||
        target.closest(".tiptap-dropdown");

      if (!isInside) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("click", handleClickOutside);

    const handleScroll = () => {
      const isAnyOpen = Object.values(dropdownState).some((d) => d.isOpen);
      if (isAnyOpen) closeAllDropdowns();
    };

    const handleResize = () => {
      const isAnyOpen = Object.values(dropdownState).some((d) => d.isOpen);
      if (isAnyOpen) closeAllDropdowns();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [dropdownState, closeAllDropdowns]);

  const handleFontChange = useCallback((font) => {
    setCurrentFont(font);
  }, []);

  const handleImageInsert = useCallback(() => {
    setIsImageModalOpen(true);
    onImageModalToggle?.(true);
  }, [onImageModalToggle]);

  const handleImageAdd = useCallback(
    (imageData) => {
      if (editor && imageData.src) {
        const fullImageUrl = normalizeImageUrl(imageData.src, false);
        const attributes = { src: fullImageUrl, alt: imageData.alt || "" };
        if (imageData.width) attributes.width = imageData.width;
        if (imageData.height) attributes.height = imageData.height;
        editor.chain().focus().setImage(attributes).run();
      }
    },
    [editor],
  );

  const runFixGrammar = useCallback(async () => {
    if (aiState === "loading" || !aiToolbar.text || !aiToolbar.range) return;

    setAiState("loading");
    setAiSuggestion(null);

    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;

    try {
      const response = await fetch(createApiUrl("/api/writing-assistant"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "fix_grammar",
          text: aiToolbar.text,
        }),
        signal: abortController.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Writing assistant failed.");
      }

      if (!data?.text?.trim()) {
        throw new Error("No suggestion was returned.");
      }

      setAiSuggestion({
        original: aiToolbar.text,
        text: data.text.trim(),
        range: aiToolbar.range,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error(error?.message || "Writing assistant failed.");
      }
    } finally {
      if (aiAbortControllerRef.current === abortController) {
        aiAbortControllerRef.current = null;
      }
      setAiState("idle");
    }
  }, [aiState, aiToolbar.range, aiToolbar.text]);

  const acceptAiSuggestion = useCallback(() => {
    if (!editor || !aiSuggestion?.text || !aiSuggestion?.range) return;

    editor
      .chain()
      .focus()
      .insertContentAt(aiSuggestion.range, textToEditorContent(aiSuggestion.text))
      .run();
    setAiSuggestion(null);
    toast.success("Grammar fix applied.");
  }, [aiSuggestion, editor]);

  const rejectAiSuggestion = useCallback(() => {
    setAiSuggestion(null);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const resetVoiceSession = useCallback(() => {
    stopRecordingTimer();
    stopMediaStream();
    audioChunksRef.current = [];
    shouldTranscribeRecordingRef.current = false;
    mediaRecorderRef.current = null;
    setRecordingSeconds(0);
  }, [stopMediaStream, stopRecordingTimer]);

  const insertTranscript = useCallback(
    (text) => {
      const transcript = text.trim();
      if (!editor || !transcript) return;

      editor.chain().focus().insertContent(transcript).run();
    },
    [editor],
  );

  const transcribeRecording = useCallback(
    async (audioBlob) => {
      if (!audioBlob?.size) {
        toast.error("No voice was recorded.");
        setVoiceState("idle");
        return;
      }

      const abortController = new AbortController();
      voiceAbortControllerRef.current = abortController;
      setVoiceState("transcribing");

      try {
        const mimeType = audioBlob.type || "audio/webm";
        const extension = getVoiceFileExtension(mimeType);
        const audioFile = new File(
          [audioBlob],
          `voice-recording.${extension}`,
          { type: mimeType },
        );
        const formData = new FormData();
        formData.append("audio", audioFile);

        const response = await fetch(createApiUrl("/api/transcriptions"), {
          method: "POST",
          credentials: "include",
          body: formData,
          signal: abortController.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Transcription failed.");
        }

        if (!data?.text?.trim()) {
          throw new Error("No speech was detected in the recording.");
        }

        insertTranscript(data.text);
        toast.success("Transcript inserted.");
      } catch (error) {
        if (error?.name !== "AbortError") {
          toast.error(error?.message || "Transcription failed.");
        }
      } finally {
        if (voiceAbortControllerRef.current === abortController) {
          voiceAbortControllerRef.current = null;
        }
        setVoiceState("idle");
      }
    },
    [insertTranscript],
  );

  const stopVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    shouldTranscribeRecordingRef.current = true;
    recorder.stop();
  }, []);

  const cancelVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    shouldTranscribeRecordingRef.current = false;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    resetVoiceSession();
    setVoiceState("idle");
  }, [resetVoiceSession]);

  const startVoiceRecording = useCallback(async () => {
    if (suppressNextVoiceClickRef.current) {
      suppressNextVoiceClickRef.current = false;
      return;
    }

    if (voiceState !== "idle") return;

    if (isTitleOrDescriptionFocused()) {
      toast.error(VOICE_CONTENT_ONLY_MESSAGE);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error("Voice recording is not supported in this browser.");
      return;
    }

    setVoiceState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeType = getSupportedVoiceMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      shouldTranscribeRecordingRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        toast.error("Voice recording failed.");
        cancelVoiceRecording();
      };

      recorder.onstop = () => {
        const shouldTranscribe = shouldTranscribeRecordingRef.current;
        const chunks = [...audioChunksRef.current];
        const recordingMimeType =
          mimeType || chunks[0]?.type || "audio/webm";

        resetVoiceSession();

        if (!shouldTranscribe) {
          setVoiceState("idle");
          return;
        }

        transcribeRecording(
          new Blob(chunks, {
            type: recordingMimeType,
          }),
        );
      };

      recorder.start();
      setRecordingSeconds(0);
      setVoiceState("recording");

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((current) => {
          const next = current + 1;
          if (next >= VOICE_MAX_RECORDING_SECONDS) {
            toast.info("Recording limit reached. Transcribing now.");
            stopVoiceRecording();
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      resetVoiceSession();
      setVoiceState("idle");
      toast.error(
        error?.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Could not start voice recording.",
      );
    }
  }, [
    cancelVoiceRecording,
    resetVoiceSession,
    stopVoiceRecording,
    transcribeRecording,
    voiceState,
  ]);

  const handleVoiceButtonMouseDown = useCallback((event) => {
    if (!isTitleOrDescriptionFocused()) return;

    event.preventDefault();
    event.stopPropagation();
    suppressNextVoiceClickRef.current = true;
    toast.error(VOICE_CONTENT_ONLY_MESSAGE);
  }, []);

  useEffect(() => {
    return () => {
      voiceAbortControllerRef.current?.abort();
      aiAbortControllerRef.current?.abort();
      resetVoiceSession();
    };
  }, [resetVoiceSession]);

  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.clearContent();
      }
      initialContentSetRef.current = false;
    };
  }, []);

  if (!isMounted || !editor) {
    return (
      <div className="w-full">
        <div className="flex items-center md:gap-2 py-3 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-8 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="mt-4 border border-gray-200 rounded-lg bg-white">
          <div className="p-4 min-h-[300px] md:min-h-[400px] flex items-start">
            <div className="text-gray-400">Start writing...</div>
          </div>
        </div>
      </div>
    );
  }

  const recordingTimeLabel = formatVoiceDuration(recordingSeconds);
  const isVoiceBusy =
    voiceState === "requesting" || voiceState === "transcribing";

  return (
    <div className="w-full relative bg-white" style={{ overflow: "visible" }}>
      <style jsx>{`
        button:hover {
          border-bottom: none !important;
        }
        button:focus {
          border-bottom: none !important;
          outline: none !important;
        }

        .voice-dictation-control {
          position: fixed;
          right: 24px;
          bottom: 128px;
          z-index: 90;
          display: flex;
          justify-content: flex-end;
          pointer-events: none;
        }

        .ai-selection-toolbar {
          position: fixed;
          z-index: 120;
          display: flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          padding: 4px;
          box-shadow:
            0 14px 30px rgba(15, 23, 42, 0.12),
            0 4px 12px rgba(15, 23, 42, 0.08);
        }

        .ai-suggestion-review {
          position: fixed;
          right: 24px;
          bottom: 196px;
          z-index: 121;
          width: 380px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          box-shadow:
            0 18px 38px rgba(15, 23, 42, 0.12),
            0 5px 16px rgba(15, 23, 42, 0.08);
        }

        .voice-dictation-shell {
          pointer-events: auto;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          overflow: hidden;
          height: 56px;
          border: 1px solid #e5e7eb;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow:
            0 14px 30px rgba(15, 23, 42, 0.08),
            0 4px 12px rgba(15, 23, 42, 0.08);
          transform-origin: right center;
          transition:
            width 360ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 260ms ease,
            box-shadow 260ms ease,
            opacity 220ms ease,
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: width, border-color, box-shadow, opacity, transform;
        }

        .voice-dictation-shell[data-state="idle"],
        .voice-dictation-shell[data-state="requesting"] {
          width: 56px;
        }

        .voice-dictation-shell[data-state="recording"] {
          width: 196px;
          border-color: #fecaca;
          box-shadow:
            0 16px 34px rgba(239, 68, 68, 0.1),
            0 5px 14px rgba(15, 23, 42, 0.08);
        }

        .voice-dictation-shell[data-state="transcribing"] {
          width: 172px;
        }

        .voice-dictation-panel {
          flex-shrink: 0;
          height: 56px;
          animation: voice-panel-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes voice-panel-in {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (min-width: 1280px) {
          .voice-dictation-control {
            right: calc(50% - 444px);
          }

          .ai-suggestion-review {
            right: calc(50% - 444px);
          }
        }

        @media (max-width: 767px) {
          .voice-dictation-control {
            right: 18px;
            bottom: 118px;
          }

          .ai-selection-toolbar {
            max-width: calc(100vw - 24px);
          }

          .ai-suggestion-review {
            right: 18px;
            bottom: 184px;
            width: calc(100vw - 36px);
          }

          .voice-dictation-shell[data-state="recording"] {
            width: 188px;
          }
        }
      `}</style>

      <EditorToolbar
        editor={editor}
        currentFont={currentFont}
        onFontChange={handleFontChange}
        onDropdownToggle={handleDropdownToggle}
        dropdownState={dropdownState}
        linkState={linkState}
        onLinkSubmit={handleLinkSubmit}
        onLinkCancel={handleLinkCancel}
        onImageInsert={handleImageInsert}
      />

      <EditorContent editor={editor} />

      {aiToolbar.visible && (
        <div
          className="ai-selection-toolbar"
          style={{ top: `${aiToolbar.top}px`, left: `${aiToolbar.left}px` }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Button
            type="button"
            className="h-8 rounded-md bg-gray-900 px-3 text-sm text-white shadow-none hover:bg-gray-800 disabled:cursor-not-allowed"
            onClick={runFixGrammar}
            disabled={aiState === "loading"}
          >
            {aiState === "loading" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            Fix Grammar
          </Button>
        </div>
      )}

      {aiSuggestion && (
        <div className="ai-suggestion-review p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">Fix Grammar</p>
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={rejectAiSuggestion}
              aria-label="Reject grammar suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2">
            <div className="max-h-28 overflow-y-auto rounded-md border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-900 line-through decoration-red-500">
              {aiSuggestion.original}
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
              {aiSuggestion.text}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md px-3 text-sm shadow-none"
              onClick={rejectAiSuggestion}
            >
              Reject
            </Button>
            <Button
              type="button"
              className="h-9 rounded-md bg-gray-900 px-3 text-sm text-white shadow-none hover:bg-gray-800"
              onClick={acceptAiSuggestion}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Accept
            </Button>
          </div>
        </div>
      )}

      <div className="voice-dictation-control">
        <div className="voice-dictation-shell" data-state={voiceState}>
          {voiceState === "recording" ? (
            <div className="voice-dictation-panel flex items-center gap-2 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="min-w-[44px] text-sm font-medium text-gray-900">
                {recordingTimeLabel}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border-0 text-gray-900 shadow-none hover:bg-gray-100"
                onClick={stopVoiceRecording}
                aria-label="Stop recording"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border-0 text-gray-500 shadow-none hover:bg-gray-100 hover:text-gray-900"
                onClick={cancelVoiceRecording}
                aria-label="Cancel recording"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : voiceState === "transcribing" ? (
            <div className="voice-dictation-panel flex items-center gap-2 px-4 text-sm font-medium text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Transcribing...</span>
            </div>
          ) : (
            <Tooltip text="Dictate article text">
              <Button
                type="button"
                size="icon"
                className="h-14 w-14 rounded-full border-0 bg-transparent text-gray-900 shadow-none hover:bg-gray-50 disabled:cursor-not-allowed"
                onClick={startVoiceRecording}
                onMouseDown={handleVoiceButtonMouseDown}
                disabled={isVoiceBusy}
                aria-label="Dictate article text"
              >
                {voiceState === "requesting" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {isImageModalOpen && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            onImageModalToggle?.(false);
          }}
          onImageAdd={handleImageAdd}
        />
      )}
    </div>
  );
});
