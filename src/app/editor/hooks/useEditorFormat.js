export function useEditorFormat(editorRef) {
  const applyFormat = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const applyHeading = (tag) => {
    if (tag === "P") {
      applyFormat("formatBlock", "<p>")
    } else {
      applyFormat("formatBlock", `<${tag}>`)
    }
  }

  const applyFontFamily = (fontName) => {
    applyFormat("fontName", fontName)
  }

  return {
    applyFormat,
    applyHeading,
    applyFontFamily,
  }
}
