"use client";

import { useState, useEffect, useCallback, memo } from "react";
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
} from "lucide-react";
import { FONT_MAP, FONT_OPTIONS } from "./utils/EditorUtils.js";

const Tooltip = ({ text, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useCallback((el) => {
    triggerRef.current = el;
  }, []);
  const tooltipRef = useCallback((el) => {
    tooltipRef.current = el;
  }, []);

  const handleMouseEnter = () => {
    const element = triggerRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
      setIsVisible(true);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className={`inline-flex ${className}`}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[10000] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm transform -translate-x-1/2 pointer-events-none whitespace-nowrap"
            style={{ top: position.top, left: position.left }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
            {text}
          </div>,
          document.body,
        )}
    </>
  );
};

const DropdownMenu = memo(({
  isOpen,
  position,
  children,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || position.top === undefined || position.top === null) {
    return null;
  }

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
});

DropdownMenu.displayName = "DropdownMenu";

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

export const useToolbarActiveState = (editor) => {
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

const FontSelector = memo(({ currentFont, onFontChange }) => {
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
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => cycleFont("up")}
          className="p-0.5 hover:bg-gray-100 rounded -mb-1"
        >
          <ChevronUp className="w-3 h-3 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => cycleFont("down")}
          className="p-0.5 hover:bg-gray-100 -mt-1"
        >
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
});

FontSelector.displayName = "FontSelector";

const HeadingSelector = memo(({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  onSelect,
  dropdownKey,
}) => {
  const headingOptions = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded shrink-0"
      >
        {headingOptions.find((h) => {
          if (h === "P") return editor?.isActive("paragraph");
          return editor?.isActive("heading", { level: parseInt(h.replace("H", "")) });
        }) || "P"}
      </button>
      <DropdownMenu
        isOpen={isOpen}
        position={position}
        onClose={onClose}
        dropdownKey={dropdownKey}
      >
        {headingOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className="block w-full px-4 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-100"
          >
            {option}
          </button>
        ))}
      </DropdownMenu>
    </>
  );
});

HeadingSelector.displayName = "HeadingSelector";

const ListSelector = memo(({
  editor,
  isOpen,
  position,
  onToggle,
  onClose,
  dropdownKey,
}) => {
  const listOptions = [
    { type: "bullet", icon: List, label: "Bullet List" },
    { type: "ordered", icon: ListOrdered, label: "Numbered List" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="p-1.5 hover:bg-gray-100 rounded shrink-0"
      >
        <List className="w-4 h-4 text-gray-600" />
      </button>
      <DropdownMenu isOpen={isOpen} position={position} onClose={onClose} dropdownKey={dropdownKey}>
        {listOptions.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => {
              if (opt.type === "bullet") {
                editor.chain().focus().toggleBulletList().run();
              } else {
                editor.chain().focus().toggleOrderedList().run();
              }
              onClose();
            }}
            className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-100"
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </button>
        ))}
      </DropdownMenu>
    </>
  );
});

ListSelector.displayName = "ListSelector";

const AlignSelector = memo(({
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
    { align: "justify", icon: AlignJustify, label: "Align Justify" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="p-1.5 hover:bg-gray-100 rounded shrink-0"
      >
        <AlignLeft className="w-4 h-4 text-gray-600" />
      </button>
      <DropdownMenu isOpen={isOpen} position={position} onClose={onClose} dropdownKey={dropdownKey}>
        {alignOptions.map((opt) => (
          <button
            key={opt.align}
            type="button"
            onClick={() => {
              editor.chain().focus().setTextAlign(opt.align).run();
              onClose();
            }}
            className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-100"
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </button>
        ))}
      </DropdownMenu>
    </>
  );
});

AlignSelector.displayName = "AlignSelector";

export { Tooltip, DropdownMenu, EditorToolbar, FontSelector, HeadingSelector, ListSelector, AlignSelector };
export default {
  Tooltip,
  DropdownMenu,
  useToolbarActiveState,
  FontSelector,
  HeadingSelector,
  ListSelector,
  AlignSelector,
};
