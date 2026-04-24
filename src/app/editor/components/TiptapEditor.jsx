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
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
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

const AI_QUICK_ACTIONS = [
  { key: "fix_grammar", label: "Fix Grammar" },
  { key: "improve_writing", label: "Improve Writing" },
];

const AI_REWRITE_ACTIONS = [
  { key: "make_shorter", label: "Make Shorter" },
  { key: "make_longer", label: "Make Longer" },
];

const AI_TONE_ACTIONS = [
  { key: "tone_formal", label: "Formal" },
  { key: "tone_casual", label: "Casual" },
  { key: "tone_professional", label: "Professional" },
];

const AI_REQUEST_DEBOUNCE_MS = 500;
const AI_MIN_RECOMMENDED_CHARS = 24;
const AI_LARGE_SELECTION_CHARS = 2500;
const AI_POPUP_WIDTH = 420;
const AI_POPUP_ESTIMATED_HEIGHT = 320;
const AI_VIEWPORT_PADDING = 12;
const AI_POPUP_GAP = 12;

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

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

const decodeBasicHtmlEntities = (value) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'");

const textToJsonContent = (text) => {
  if (!text) return [];

  return text
    .split("\n")
    .reduce((content, line, index) => {
      if (index > 0) {
        content.push({ type: "hardBreak" });
      }
      if (line) {
        content.push({ type: "text", text: line });
      }
      return content;
    }, []);
};

const textToEditorContent = (text) => {
  const normalized = decodeBasicHtmlEntities(text).trim();
  if (!normalized) return [];

  if (!/\n/.test(normalized)) {
    return { type: "text", text: normalized };
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      content: textToJsonContent(paragraph),
    }));
};

const normalizeForComparison = (text) =>
  decodeBasicHtmlEntities(text || "")
    .replace(/\s+/g, " ")
    .trim();

const getWordDiff = (before = "", after = "") => {
  const oldWords = normalizeForComparison(before)
    .split(/\s+/)
    .filter(Boolean);
  const newWords = normalizeForComparison(after)
    .split(/\s+/)
    .filter(Boolean);
  const matrix = Array.from({ length: oldWords.length + 1 }, () =>
    Array(newWords.length + 1).fill(0),
  );

  for (let i = oldWords.length - 1; i >= 0; i -= 1) {
    for (let j = newWords.length - 1; j >= 0; j -= 1) {
      matrix[i][j] =
        oldWords[i] === newWords[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  const parts = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      parts.push({ type: "equal", text: oldWords[i] });
      i += 1;
      j += 1;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      parts.push({ type: "delete", text: oldWords[i] });
      i += 1;
    } else {
      parts.push({ type: "insert", text: newWords[j] });
      j += 1;
    }
  }

  while (i < oldWords.length) {
    parts.push({ type: "delete", text: oldWords[i] });
    i += 1;
  }

  while (j < newWords.length) {
    parts.push({ type: "insert", text: newWords[j] });
    j += 1;
  }

  return parts;
};

const countDiffChanges = (parts) => {
  let count = 0;
  let inChange = false;

  parts.forEach((part) => {
    if (part.type === "equal") {
      inChange = false;
      return;
    }

    if (!inChange) {
      count += 1;
      inChange = true;
    }
  });

  return count;
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
    width: 0,
    text: "",
    range: null,
    popup: null,
  });
  const [aiMenu, setAiMenu] = useState({
    type: null,
    position: null,
  });
  const [aiState, setAiState] = useState("idle");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiDisplayedFixCount, setAiDisplayedFixCount] = useState(0);
  const [aiAcceptFlash, setAiAcceptFlash] = useState(false);

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
  const aiLastRequestRef = useRef(null);
  const aiLastClickRef = useRef(0);
  const aiPopupRef = useRef(null);
  const aiToolbarRef = useRef(null);
  const aiMenuRef = useRef(null);
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
        setAiMenu((current) => (current.type ? { type: null, position: null } : current));
        setAiToolbar((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
        return;
      }

      const { from, to, empty } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, "\n\n").trim();

      if (empty || !selectedText) {
        setAiMenu((current) => (current.type ? { type: null, position: null } : current));
        setAiToolbar((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
        return;
      }

      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const viewportPadding = AI_VIEWPORT_PADDING;
        const editorBounds = editor.view.dom.getBoundingClientRect();
        const editorLeft = Math.max(editorBounds.left, viewportPadding);
        const editorRight = Math.min(
          editorBounds.right,
          window.innerWidth - viewportPadding,
        );
        const editorWidth = Math.max(editorRight - editorLeft, 0);
        const toolbarRenderedWidth =
          typeof document !== "undefined"
            ? document
                .querySelector(".ai-selection-toolbar")
                ?.getBoundingClientRect().width
            : 0;
        const toolbarWidth = Math.min(
          Math.max(toolbarRenderedWidth || 540, 320),
          editorWidth || window.innerWidth - viewportPadding * 2,
        );
        const selectionCenter = Math.min(
          Math.max((start.left + end.right) / 2, editorLeft + toolbarWidth / 2),
          editorRight - toolbarWidth / 2,
        );
        const left = Math.min(
          Math.max(selectionCenter - toolbarWidth / 2, editorLeft),
          Math.max(editorLeft, editorRight - toolbarWidth),
        );
        const top = Math.max(Math.min(start.top, end.top) - 52, 12);
        const popupGap = AI_POPUP_GAP;
        const popupWidth = Math.min(
          AI_POPUP_WIDTH,
          window.innerWidth - viewportPadding * 2,
        );
        const selectionLeft = Math.min(start.left, end.left);
        const selectionRight = Math.max(start.right, end.right);
        const selectionTop = Math.min(start.top, end.top);
        const selectionBottom = Math.max(start.bottom, end.bottom);
        const maxPopupTop = Math.max(
          viewportPadding,
          window.innerHeight - AI_POPUP_ESTIMATED_HEIGHT - viewportPadding,
        );
        const hasSpaceBelow =
          selectionBottom + AI_POPUP_ESTIMATED_HEIGHT + 16 < window.innerHeight;
        const hasSpaceRight =
          window.innerWidth - selectionRight >= popupWidth + popupGap + viewportPadding;
        const hasSpaceLeft =
          selectionLeft >= popupWidth + popupGap + viewportPadding;
        let popupTop = hasSpaceBelow
          ? selectionBottom + 10
          : Math.max(
              selectionTop - AI_POPUP_ESTIMATED_HEIGHT - 10,
              viewportPadding,
            );
        let popupLeft = Math.min(
          Math.max(selectionCenter - popupWidth / 2, viewportPadding),
          window.innerWidth - popupWidth - viewportPadding,
        );
        let popupPlacement = hasSpaceBelow ? "below" : "above";

        if (hasSpaceRight || hasSpaceLeft) {
          popupLeft = hasSpaceRight
            ? selectionRight + popupGap
            : selectionLeft - popupWidth - popupGap;
          popupTop = Math.min(
            Math.max(selectionTop - 16, viewportPadding),
            maxPopupTop,
          );
          popupPlacement = hasSpaceRight ? "right" : "left";
        }

        setAiToolbar({
          visible: true,
          top,
          left,
          width: toolbarWidth,
          text: selectedText,
          range: { from, to },
          popup: {
            top: popupTop,
            left: popupLeft,
            width: popupWidth,
            placement: popupPlacement,
          },
        });
        setAiMenu((current) => (current.type ? { type: null, position: null } : current));
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
    if (!editor || !aiSuggestion?.range || !aiPopupRef.current) return;
    if (typeof window === "undefined" || window.innerWidth <= 767) return;

    const updateAiPopupPosition = () => {
      const popup = aiPopupRef.current;
      if (!popup) return;

      try {
        const { from, to } = aiSuggestion.range;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const popupRect = popup.getBoundingClientRect();
        const viewportPadding = AI_VIEWPORT_PADDING;
        const popupGap = AI_POPUP_GAP;
        const popupWidth = Math.min(
          popupRect.width,
          window.innerWidth - viewportPadding * 2,
        );
        const popupHeight = popupRect.height;
        const editorBounds = editor.view.dom.getBoundingClientRect();
        const editorLeft = Math.max(editorBounds.left, viewportPadding);
        const editorRight = Math.min(
          editorBounds.right,
          window.innerWidth - viewportPadding,
        );
        const selectionCenter = (start.left + end.right) / 2;
        const selectionLeft = Math.min(start.left, end.left);
        const selectionRight = Math.max(start.right, end.right);
        const selectionTop = Math.min(start.top, end.top);
        const selectionBottom = Math.max(start.bottom, end.bottom);
        const hasSpaceBelow =
          selectionBottom + popupGap + popupHeight <=
          window.innerHeight - viewportPadding;
        const hasSpaceAbove =
          selectionTop - popupGap - popupHeight >= viewportPadding;
        const hasSpaceRight = selectionRight + popupGap + popupWidth <= editorRight;
        const hasSpaceLeft = selectionLeft - popupGap - popupWidth >= editorLeft;
        const currentPlacement = aiSuggestion.position?.placement;

        let nextPlacement = currentPlacement;
        let nextLeft = clampNumber(
          selectionCenter - popupWidth / 2,
          editorLeft,
          Math.max(editorLeft, editorRight - popupWidth),
        );
        let nextTop = hasSpaceBelow
          ? selectionBottom + 10
          : selectionTop - popupHeight - 10;

        if (
          (currentPlacement === "right" && hasSpaceRight) ||
          (!hasSpaceBelow && !hasSpaceAbove && hasSpaceRight)
        ) {
          nextPlacement = "right";
          nextLeft = Math.min(selectionRight + popupGap, editorRight - popupWidth);
          nextTop = clampNumber(
            selectionTop - 16,
            viewportPadding,
            window.innerHeight - popupHeight - viewportPadding,
          );
        } else if (
          (currentPlacement === "left" && hasSpaceLeft) ||
          (!hasSpaceBelow && !hasSpaceAbove && hasSpaceLeft)
        ) {
          nextPlacement = "left";
          nextLeft = Math.max(selectionLeft - popupWidth - popupGap, editorLeft);
          nextTop = clampNumber(
            selectionTop - 16,
            viewportPadding,
            window.innerHeight - popupHeight - viewportPadding,
          );
        } else if (hasSpaceBelow) {
          nextPlacement = "below";
          nextTop = selectionBottom + 10;
        } else if (hasSpaceAbove) {
          nextPlacement = "above";
          nextTop = selectionTop - popupHeight - 10;
        } else {
          nextPlacement = selectionBottom <= window.innerHeight / 2 ? "below" : "above";
          nextTop = clampNumber(
            selectionBottom + 10,
            viewportPadding,
            window.innerHeight - popupHeight - viewportPadding,
          );
        }

        nextTop = clampNumber(
          nextTop,
          viewportPadding,
          window.innerHeight - popupHeight - viewportPadding,
        );

        setAiSuggestion((current) => {
          if (!current) return current;

          const previous = current.position || {};
          if (
            Math.abs((previous.top ?? 0) - nextTop) < 1 &&
            Math.abs((previous.left ?? 0) - nextLeft) < 1 &&
            Math.abs((previous.width ?? popupWidth) - popupWidth) < 1 &&
            previous.placement === nextPlacement
          ) {
            return current;
          }

          return {
            ...current,
            position: {
              ...previous,
              top: nextTop,
              left: nextLeft,
              width: popupWidth,
              placement: nextPlacement,
            },
          };
        });
      } catch {
        // Keep the last stable popup position if measurement fails.
      }
    };

    const frame = window.requestAnimationFrame(updateAiPopupPosition);
    window.addEventListener("resize", updateAiPopupPosition);
    window.addEventListener("scroll", updateAiPopupPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateAiPopupPosition);
      window.removeEventListener("scroll", updateAiPopupPosition, true);
    };
  }, [
    aiSuggestion?.position?.placement,
    aiSuggestion?.range,
    aiSuggestion?.status,
    aiSuggestion?.text,
    editor,
  ]);

  useEffect(() => {
    if (!editor || !aiToolbar.visible || !aiToolbar.range || !aiToolbarRef.current) return;

    const updateMeasuredToolbarPosition = () => {
      try {
        const { from, to } = aiToolbar.range;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const viewportPadding = AI_VIEWPORT_PADDING;
        const editorBounds = editor.view.dom.getBoundingClientRect();
        const editorLeft = Math.max(editorBounds.left, viewportPadding);
        const editorRight = Math.min(
          editorBounds.right,
          window.innerWidth - viewportPadding,
        );
        const editorWidth = Math.max(editorRight - editorLeft, 0);
        const measuredWidth = Math.min(
          aiToolbarRef.current.getBoundingClientRect().width,
          editorWidth || window.innerWidth - viewportPadding * 2,
        );
        const selectionCenter = Math.min(
          Math.max((start.left + end.right) / 2, editorLeft + measuredWidth / 2),
          editorRight - measuredWidth / 2,
        );
        const nextLeft = Math.min(
          Math.max(selectionCenter - measuredWidth / 2, editorLeft),
          Math.max(editorLeft, editorRight - measuredWidth),
        );
        const nextTop = Math.max(Math.min(start.top, end.top) - 52, 12);

        setAiToolbar((current) => {
          if (!current.visible) return current;

          if (
            Math.abs((current.left ?? 0) - nextLeft) < 1 &&
            Math.abs((current.top ?? 0) - nextTop) < 1 &&
            Math.abs((current.width ?? 0) - measuredWidth) < 1
          ) {
            return current;
          }

          return {
            ...current,
            top: nextTop,
            left: nextLeft,
            width: measuredWidth,
          };
        });
      } catch {
        // Keep the last stable toolbar position if measurement fails.
      }
    };

    const frame = window.requestAnimationFrame(updateMeasuredToolbarPosition);
    window.addEventListener("resize", updateMeasuredToolbarPosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateMeasuredToolbarPosition);
    };
  }, [aiToolbar.range, aiToolbar.visible, aiToolbar.text, editor]);

  useEffect(() => {
    if (!aiMenu.type) return;

    const handlePointerDown = (event) => {
      if (aiMenuRef.current?.contains(event.target)) return;
      if (aiToolbarRef.current?.contains(event.target)) return;
      closeAiMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeAiMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiMenu.type, closeAiMenu]);

  useEffect(() => {
    if (!editor || aiState !== "loading") return;

    const cancelAiOnEdit = ({ transaction }) => {
      if (!transaction?.docChanged) return;

      aiAbortControllerRef.current?.abort();
      setAiState("idle");
      setAiSuggestion((current) =>
        current
          ? {
              ...current,
              status: current.text ? "partial" : "error",
              error: "Suggestion cancelled because the text changed.",
            }
          : current,
      );
    };

    editor.on("transaction", cancelAiOnEdit);
    return () => {
      editor.off("transaction", cancelAiOnEdit);
    };
  }, [aiState, editor]);

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

  const parseAiStream = useCallback(async (response, onEvent) => {
    if (!response.body) {
      const data = await response.json().catch(() => null);
      onEvent("done", data || {});
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";

      for (const message of messages) {
        const lines = message.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event:"));
        const dataLine = lines.find((line) => line.startsWith("data:"));
        const event = eventLine?.replace(/^event:\s*/, "") || "message";

        if (!dataLine) continue;

        const payload = dataLine.replace(/^data:\s*/, "");
        if (!payload) continue;

        let data;
        try {
          data = JSON.parse(payload);
        } catch {
          // Ignore malformed stream fragments and keep reading.
          continue;
        }

        onEvent(event, data);
      }
    }
  }, []);

  const closeAiMenu = useCallback(() => {
    setAiMenu((current) => (current.type ? { type: null, position: null } : current));
  }, []);

  const openAiMenu = useCallback((type, event) => {
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = type === "tone" ? 188 : 208;
    const left = clampNumber(
      triggerRect.right - menuWidth,
      AI_VIEWPORT_PADDING,
      window.innerWidth - menuWidth - AI_VIEWPORT_PADDING,
    );

    setAiMenu({
      type,
      position: {
        top: triggerRect.bottom + 8,
        left,
        width: menuWidth,
      },
    });
  }, []);

  const getAiResponseError = useCallback(async (response) => {
    const data = await response.json().catch(() => null);
    const rawMessage = data?.error || data?.message || "";
    let message = rawMessage || "Writing assistant failed.";

    if (response.status === 401 || response.status === 403) {
      message = "Your session expired. Sign in again and retry.";
    } else if (/not configured/i.test(rawMessage)) {
      message = "AI is not configured. Add GEMINI_API_KEY in Render.";
    } else if (response.status === 429) {
      message = rawMessage || "AI request limit reached. Please try again later.";
    } else if (response.status >= 500) {
      message =
        rawMessage ||
        "AI service did not respond. Check the backend logs and Gemini key.";
    }

    const error = new Error(message);
    error.status = response.status;
    error.rawMessage = rawMessage;
    return error;
  }, []);

  const requestAiSuggestion = useCallback(
    async ({ actionKey, requestText, stream, signal }) => {
      const response = await fetch(createApiUrl("/api/writing-assistant"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: actionKey,
          text: requestText,
          stream,
        }),
        signal,
      });

      if (!response.ok) {
        throw await getAiResponseError(response);
      }

      return response;
    },
    [getAiResponseError],
  );

  const requestAiSuggestionFallback = useCallback(
    async ({ actionKey, requestText, signal }) => {
      const response = await requestAiSuggestion({
        actionKey,
        requestText,
        stream: false,
        signal,
      });
      const data = await response.json().catch(() => null);
      const text =
        typeof data?.text === "string" ? decodeBasicHtmlEntities(data.text) : "";

      if (!text.trim()) {
        throw new Error("AI returned an empty suggestion.");
      }

      return {
        text: text.trim(),
        label: data?.label,
      };
    },
    [requestAiSuggestion],
  );

  const runAiAction = useCallback(async (actionKey, actionLabel, options = {}) => {
    if (aiState === "loading") return;
    closeAiMenu();

    const requestText = options.text || aiToolbar.text;
    const requestRange = options.range || aiToolbar.range;
    const requestOriginal = options.original || requestText;
    const requestPosition = options.position || aiToolbar.popup;

    if (!requestText || !requestRange) return;

    const now = Date.now();
    if (!options.retry && now - aiLastClickRef.current < AI_REQUEST_DEBOUNCE_MS) {
      return;
    }
    aiLastClickRef.current = now;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAiSuggestion({
        original: requestOriginal,
        text: "",
        range: requestRange,
        label: actionLabel,
        status: "error",
        error: "No internet connection",
        actionKey,
        position: requestPosition,
      });
      return;
    }

    if (requestText.length < AI_MIN_RECOMMENDED_CHARS) {
      toast.info("Select at least a sentence for best results.");
    }

    if (requestText.length > AI_LARGE_SELECTION_CHARS) {
      toast.info("Large selection may take longer.");
    }

    setAiState("loading");
    aiLastRequestRef.current = {
      actionKey,
      actionLabel,
      text: requestText,
      original: requestOriginal,
      range: requestRange,
      position: requestPosition,
    };
    setAiSuggestion({
      original: requestOriginal,
      text: "",
      range: requestRange,
      label: actionLabel,
      status: "streaming",
      actionKey,
      position: requestPosition,
    });

    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;

    try {
      const response = await requestAiSuggestion({
        actionKey,
        requestText,
        stream: true,
        signal: abortController.signal,
      });
      let streamedText = "";

      await parseAiStream(response, (event, data) => {
        if (event === "start") {
          setAiSuggestion((current) => ({
            ...current,
            label: data.label || actionLabel,
          }));
          return;
        }

        if (event === "chunk") {
          const nextText = typeof data.text === "string" ? data.text : "";
          streamedText += nextText;
          setAiSuggestion((current) => ({
            ...current,
            text: decodeBasicHtmlEntities(streamedText),
          }));
          return;
        }

        if (event === "done") {
          const finalText =
            typeof data.text === "string" && data.text.trim()
              ? data.text.trim()
              : streamedText.trim();
          setAiSuggestion((current) => ({
            ...current,
            text: finalText,
            status:
              normalizeForComparison(finalText) ===
              normalizeForComparison(requestOriginal)
                ? "no_changes"
                : "ready",
            label: data.label || current?.label || actionLabel,
          }));
          streamedText = finalText;
          return;
        }

        if (event === "error") {
          throw new Error(data.error || "Writing assistant failed.");
        }
      });

      if (!streamedText.trim()) {
        throw new Error("No suggestion was returned.");
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      const shouldTryFallback =
        !error?.status || error.status === 502 || error.status === 504;

      if (shouldTryFallback) {
        try {
          setAiSuggestion((current) =>
            current
              ? {
                  ...current,
                  error: "Live preview stopped. Retrying once...",
                }
              : current,
          );

          const fallback = await requestAiSuggestionFallback({
            actionKey,
            requestText,
            signal: abortController.signal,
          });

          setAiSuggestion((current) => ({
            ...current,
            text: fallback.text,
            status:
              normalizeForComparison(fallback.text) ===
              normalizeForComparison(requestOriginal)
                ? "no_changes"
                : "ready",
            label: fallback.label || current?.label || actionLabel,
            error: "",
          }));
          return;
        } catch (fallbackError) {
          if (fallbackError?.name === "AbortError") {
            return;
          }

          setAiSuggestion((current) =>
            current
              ? {
                  ...current,
                  status: current.text ? "partial" : "error",
                  error:
                    fallbackError?.message ||
                    error?.message ||
                    "Writing assistant failed.",
                }
              : current,
          );
          toast.error(
            fallbackError?.message || error?.message || "Writing assistant failed.",
          );
          return;
        }
      }

      setAiSuggestion((current) =>
        current
          ? {
              ...current,
              status: current.text ? "partial" : "error",
              error: error?.message || "Writing assistant failed.",
            }
          : current,
      );
      toast.error(error?.message || "Writing assistant failed.");
    } finally {
      if (aiAbortControllerRef.current === abortController) {
        aiAbortControllerRef.current = null;
      }
      setAiState("idle");
    }
  }, [
    aiState,
    aiToolbar.popup,
    aiToolbar.range,
    aiToolbar.text,
    closeAiMenu,
    requestAiSuggestion,
    requestAiSuggestionFallback,
    parseAiStream,
  ]);

  const acceptAiSuggestion = useCallback(() => {
    if (
      !editor ||
      !aiSuggestion?.text ||
      !aiSuggestion?.range ||
      aiSuggestion.status === "streaming"
    ) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(aiSuggestion.range, textToEditorContent(aiSuggestion.text))
      .run();
    setAiSuggestion(null);
    setAiAcceptFlash(true);
    setTimeout(() => setAiAcceptFlash(false), 420);
    toast.success("AI suggestion applied.");
  }, [aiSuggestion, editor]);

  const rejectAiSuggestion = useCallback(() => {
    aiAbortControllerRef.current?.abort();
    setAiSuggestion(null);
    setAiState("idle");
  }, []);

  const retryAiSuggestion = useCallback(() => {
    const lastRequest = aiLastRequestRef.current;
    if (!lastRequest) return;

    runAiAction(lastRequest.actionKey, lastRequest.actionLabel, {
      text: lastRequest.text,
      original: lastRequest.original,
      range: lastRequest.range,
      position: lastRequest.position,
      retry: true,
    });
  }, [runAiAction]);

  const hasAiSuggestionText = Boolean(aiSuggestion?.text);

  const dismissAiPopup = useCallback(
    (confirmDiscard = false) => {
      if (
        confirmDiscard &&
        hasAiSuggestionText &&
        ["ready", "partial"].includes(aiSuggestion.status) &&
        !window.confirm("Discard AI suggestion?")
      ) {
        return;
      }

      rejectAiSuggestion();
    },
    [aiSuggestion?.status, hasAiSuggestionText, rejectAiSuggestion],
  );

  const aiDiffParts = useMemo(
    () => getWordDiff(aiSuggestion?.original || "", aiSuggestion?.text || ""),
    [aiSuggestion?.original, aiSuggestion?.text],
  );

  const aiFixCount = useMemo(
    () => countDiffChanges(aiDiffParts),
    [aiDiffParts],
  );

  useEffect(() => {
    if (!aiSuggestion || aiSuggestion.status !== "ready") {
      setAiDisplayedFixCount(0);
      return;
    }

    let current = 0;
    const target = aiFixCount;
    if (!target) return;

    const timer = setInterval(() => {
      current += 1;
      setAiDisplayedFixCount(Math.min(current, target));
      if (current >= target) clearInterval(timer);
    }, 80);

    return () => clearInterval(timer);
  }, [aiFixCount, aiSuggestion]);

  useEffect(() => {
    if (aiSuggestion?.status !== "no_changes") return;

    const timer = setTimeout(() => {
      setAiSuggestion(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [aiSuggestion?.status]);

  useEffect(() => {
    if (!aiSuggestion?.status) return;

    const popup = aiPopupRef.current;
    const getFocusable = () =>
      Array.from(
        popup?.querySelectorAll(
          'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      );

    const focusables = getFocusable();
    focusables[0]?.focus?.();

    const handlePointerDown = (event) => {
      if (popup?.contains(event.target)) return;
      dismissAiPopup(true);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissAiPopup(true);
        return;
      }

      if (event.key !== "Tab") return;

      const items = getFocusable();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiSuggestion?.status, dismissAiPopup]);

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
          justify-content: flex-start;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.98);
          padding: 6px;
          max-width: calc(100vw - 24px);
          overflow: hidden;
          box-shadow:
            0 18px 34px rgba(15, 23, 42, 0.14),
            0 6px 14px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
        }

        .ai-selection-scroll {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          width: 100%;
          max-width: 100%;
          overflow: visible;
          scrollbar-width: none;
        }

        .ai-selection-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          background: #0f172a;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .ai-selection-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          transition:
            border-color 160ms ease,
            background-color 160ms ease,
            color 160ms ease,
            transform 160ms ease;
          flex-shrink: 0;
        }

        .ai-selection-button:hover:not(:disabled) {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
        }

        .ai-selection-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-selection-button[data-primary="true"] {
          background: #f8fafc;
          color: #0f172a;
        }

        .ai-selection-divider {
          width: 1px;
          height: 20px;
          background: #e2e8f0;
          flex-shrink: 0;
        }

        .ai-selection-menu {
          min-width: 188px;
          padding: 6px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.98);
          box-shadow:
            0 18px 34px rgba(15, 23, 42, 0.14),
            0 6px 14px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
        }

        .ai-selection-menu-header {
          padding: 6px 8px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .ai-selection-menu-item {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          padding: 9px 10px;
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
        }

        .ai-selection-menu-item:hover:not(:disabled) {
          background: #f8fafc;
        }

        .ai-selection-scroll::-webkit-scrollbar {
          display: none;
        }

        .ai-editor-accept-flash {
          animation: ai-editor-flash 420ms ease-out;
        }

        .ai-suggestion-review {
          position: fixed;
          z-index: 121;
          width: 420px;
          max-height: calc(100vh - 24px);
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          color: #1a1a2e;
          overflow: hidden;
          box-shadow:
            0 18px 42px rgba(15, 23, 42, 0.13),
            0 5px 16px rgba(15, 23, 42, 0.08);
          animation: ai-popup-in 150ms ease-out both;
        }

        .ai-popup-mobile-handle {
          display: none;
        }

        .ai-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 42px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          padding: 0 12px;
        }

        .ai-popup-body {
          max-height: min(360px, calc(100vh - 96px), 56vh);
          overflow-y: auto;
          padding: 12px;
        }

        .ai-popup-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #64748b;
        }

        .ai-diff-box {
          margin-top: 6px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          padding: 9px;
          font-size: 13px;
          line-height: 1.6;
          color: #334155;
        }

        .ai-diff-delete {
          border-radius: 4px;
          background: rgba(255, 77, 77, 0.13);
          color: #ef4444;
          text-decoration: line-through;
          text-decoration-color: #ef4444;
        }

        .ai-diff-insert {
          border-radius: 4px;
          background: rgba(34, 197, 94, 0.13);
          color: #22c55e;
        }

        .ai-change-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          background: #f1f5f9;
          color: #475569;
          padding: 4px 9px;
          font-size: 12px;
          font-weight: 600;
        }

        .ai-popup-skeleton {
          height: 78px;
          border-radius: 7px;
          background: linear-gradient(
            90deg,
            #f1f5f9 0%,
            #e2e8f0 45%,
            #f1f5f9 90%
          );
          background-size: 220% 100%;
          animation: ai-shimmer 1.2s ease-in-out infinite;
        }

        .ai-spin-sparkle {
          animation: ai-spin 900ms linear infinite;
        }

        @keyframes ai-popup-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ai-shimmer {
          from {
            background-position: 120% 0;
          }
          to {
            background-position: -120% 0;
          }
        }

        @keyframes ai-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ai-editor-flash {
          0% {
            background: rgba(34, 197, 94, 0);
          }
          35% {
            background: rgba(34, 197, 94, 0.14);
          }
          100% {
            background: rgba(34, 197, 94, 0);
          }
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
        }

        @media (max-width: 767px) {
          .voice-dictation-control {
            right: 18px;
            bottom: 118px;
          }

          .ai-selection-toolbar {
            max-width: calc(100vw - 24px);
          }

          .ai-selection-scroll {
            justify-content: flex-start;
            flex-wrap: nowrap;
            overflow-x: auto;
          }

          .ai-suggestion-review {
            left: 0 !important;
            right: 0;
            top: auto !important;
            bottom: 0;
            width: 100vw !important;
            max-height: 60vh;
            border-radius: 16px 16px 0 0;
            animation: ai-bottom-sheet-in 150ms ease-out both;
          }

          .ai-popup-body {
            max-height: calc(60vh - 48px);
            padding-top: 18px;
          }

          .ai-popup-mobile-handle {
            display: block;
          }

          @keyframes ai-bottom-sheet-in {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
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

      <div className={aiAcceptFlash ? "ai-editor-accept-flash" : ""}>
        <EditorContent editor={editor} />
      </div>

      {aiToolbar.visible && (
        <div
          ref={aiToolbarRef}
          className="ai-selection-toolbar"
          style={{
            top: `${aiToolbar.top}px`,
            left: `${aiToolbar.left}px`,
            maxWidth: aiToolbar.width ? `${aiToolbar.width}px` : undefined,
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="ai-selection-scroll">
            <div className="ai-selection-badge">
              <Sparkles className="h-4 w-4" />
              <span>Ask AI</span>
            </div>

            {AI_QUICK_ACTIONS.map((action, index) => (
              <button
                key={action.key}
                type="button"
                className="ai-selection-button"
                data-primary={index === 0 ? "true" : "false"}
                onClick={() => runAiAction(action.key, action.label)}
                disabled={aiState === "loading"}
              >
                {index === 0 ? (
                  aiState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )
                ) : null}
                {action.label}
              </button>
            ))}

            <span className="ai-selection-divider" />

            <button
              type="button"
              className="ai-selection-button"
              onClick={(event) =>
                aiMenu.type === "rewrite"
                  ? closeAiMenu()
                  : openAiMenu("rewrite", event)
              }
              aria-expanded={aiMenu.type === "rewrite"}
              aria-haspopup="menu"
              disabled={aiState === "loading"}
            >
              Rewrite
              <ChevronDown className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="ai-selection-button"
              onClick={(event) =>
                aiMenu.type === "tone"
                  ? closeAiMenu()
                  : openAiMenu("tone", event)
              }
              aria-expanded={aiMenu.type === "tone"}
              aria-haspopup="menu"
              disabled={aiState === "loading"}
            >
              Tone
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <DropdownMenu
        isOpen={Boolean(aiMenu.type)}
        position={aiMenu.position || {}}
        onClose={closeAiMenu}
        className="ai-selection-menu"
      >
        <div ref={aiMenuRef}>
          <div className="ai-selection-menu-header">
            {aiMenu.type === "tone" ? "Change Tone" : "Rewrite"}
          </div>
          {(aiMenu.type === "tone" ? AI_TONE_ACTIONS : AI_REWRITE_ACTIONS).map(
            (action) => (
              <button
                key={action.key}
                type="button"
                className="ai-selection-menu-item"
                onClick={() => runAiAction(action.key, action.label)}
                disabled={aiState === "loading"}
              >
                <span>{action.label}</span>
                {action.key === "tone_formal" ? (
                  <span className="text-xs font-medium text-slate-400">A</span>
                ) : action.key === "tone_casual" ? (
                  <span className="text-xs font-medium text-slate-400">a</span>
                ) : action.key === "tone_professional" ? (
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                ) : action.key === "make_shorter" ? (
                  <span className="text-xs font-medium text-slate-400">−</span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">+</span>
                )}
              </button>
            ),
          )}
        </div>
      </DropdownMenu>

      {aiSuggestion && (
        <div
          ref={aiPopupRef}
          className="ai-suggestion-review"
          style={{
            top: `${aiSuggestion.position?.top ?? 120}px`,
            left: `${aiSuggestion.position?.left ?? 24}px`,
            width: `${aiSuggestion.position?.width ?? AI_POPUP_WIDTH}px`,
          }}
          role="dialog"
          aria-label={aiSuggestion.label || "AI writing suggestion"}
          aria-live="polite"
        >
          <div className="ai-popup-mobile-handle mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300" />
          <div className="ai-popup-header">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles
                className={`h-4 w-4 shrink-0 ${
                  aiSuggestion.status === "streaming" ? "ai-spin-sparkle" : ""
                }`}
              />
              <p className="truncate text-sm font-semibold">
                {aiSuggestion.label || "Grammar Fix"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              onClick={() => dismissAiPopup(true)}
              aria-label="Close AI suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="ai-popup-body">
            {aiSuggestion.status === "streaming" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#1a1a2e]">
                  <Sparkles className="ai-spin-sparkle h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Analyzing your text...
                  </span>
                </div>
                {aiSuggestion.error && (
                  <p className="text-xs font-medium text-slate-500">
                    {aiSuggestion.error}
                  </p>
                )}
                <div className="ai-popup-skeleton" />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 text-sm text-slate-600 shadow-none"
                    onClick={rejectAiSuggestion}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {aiSuggestion.status === "no_changes" && (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#22c55e]" />
                <p className="text-base font-semibold text-[#1a1a2e]">
                  Looks great! No grammar issues found.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg px-3 text-sm text-slate-600 shadow-none"
                  onClick={rejectAiSuggestion}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Close
                </Button>
              </div>
            )}

            {aiSuggestion.status === "error" && (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-center">
                <AlertTriangle className="h-10 w-10 text-[#ef4444]" />
                <div>
                  <p className="text-base font-semibold text-[#1a1a2e]">
                    Something went wrong. Please try again.
                  </p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {aiSuggestion.error || "AI could not improve this text."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 shadow-none"
                    onClick={retryAiSuggestion}
                    disabled={aiState === "loading"}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Retry
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 text-sm text-slate-600 shadow-none"
                    onClick={rejectAiSuggestion}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Close
                  </Button>
                </div>
              </div>
            )}

            {["ready", "partial"].includes(aiSuggestion.status) && (
              <div className="space-y-4">
                <div>
                  <p className="ai-popup-label">Before</p>
                  <div className="ai-diff-box">
                    {aiDiffParts
                      .filter((part) => part.type !== "insert")
                      .map((part, index) => (
                        <span
                          key={`${part.type}-before-${index}`}
                          className={
                            part.type === "delete" ? "ai-diff-delete" : ""
                          }
                        >
                          {part.text}
                          {" "}
                        </span>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="ai-popup-label">After</p>
                  <div className="ai-diff-box">
                    {aiDiffParts
                      .filter((part) => part.type !== "delete")
                      .map((part, index) => (
                        <span
                          key={`${part.type}-after-${index}`}
                          className={
                            part.type === "insert" ? "ai-diff-insert" : ""
                          }
                        >
                          {part.text}
                          {" "}
                        </span>
                      ))}
                  </div>
                </div>

                {aiSuggestion.status === "partial" && (
                  <p className="text-xs text-amber-700">
                    Streaming stopped. You can retry or accept the partial result.
                  </p>
                )}

                <div className="ai-change-badge">
                  Changes: {aiDisplayedFixCount}{" "}
                  {aiDisplayedFixCount === 1 ? "fix" : "fixes"} found
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    className="h-9 rounded-lg bg-[#22c55e] px-3 text-sm text-white shadow-none transition-transform hover:scale-[1.02] hover:bg-[#16a34a]"
                    onClick={acceptAiSuggestion}
                    disabled={!aiSuggestion.text}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg border border-[#ef4444] px-3 text-sm text-[#ef4444] shadow-none hover:bg-red-50"
                    onClick={rejectAiSuggestion}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Discard
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg px-3 text-sm text-slate-600 shadow-none"
                    onClick={retryAiSuggestion}
                    disabled={aiState === "loading"}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
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
