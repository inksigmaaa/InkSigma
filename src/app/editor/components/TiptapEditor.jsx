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
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ImageModal } from "./ImageModal";
import { EditorToolbar } from "./toolbar/EditorToolbar";
import TiptapEditorStyles from "./TiptapEditorStyles";
import { normalizeImageUrl, processEditorContent } from "./utils/EditorUtils";

const DROPDOWN_KEYS = [
  "heading",
  "list",
  "align",
  "advanced",
  "link",
  "lineSpacing",
  "color",
];

export const TiptapEditor = memo(function TiptapEditor({
  onUpdate,
  initialContent = "",
  onImageModalToggle,
  editorRef: externalEditorRef,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentFont, setCurrentFont] = useState("Roboto");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [dropdownState, setDropdownState] = useState(() => {
    const initial = {};
    DROPDOWN_KEYS.forEach((key) => {
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

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setDropdownState((prev) => {
      const updated = { ...prev };
      DROPDOWN_KEYS.forEach((key) => {
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
      DROPDOWN_KEYS.forEach((k) => {
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
    // Don't re-render this large component on every keystroke/selection. The
    // toolbar keeps its own equality-gated subscription (useToolbarActiveState
    // via editor.on("transaction"/"selectionUpdate")), so active-state UI still
    // updates without forcing a full editor re-render on each transaction.
    shouldRerenderOnTransaction: false,
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
      view.dom.style.fontFamily = `${currentFont}, sans-serif`;
    }
  }, [editor, currentFont]);

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

  useEffect(() => {
    return () => {
      if (externalEditorRef) {
        externalEditorRef.current = null;
      }
      editorRef.current = null;
      initialContentSetRef.current = false;
    };
  }, [externalEditorRef]);

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

  return (
    <div className="w-full relative bg-white" style={{ overflow: "visible" }}>
      <TiptapEditorStyles />

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
