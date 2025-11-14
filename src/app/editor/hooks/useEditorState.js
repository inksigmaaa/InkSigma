import { useState, useRef } from "react"

export function useEditorState() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [font, setFont] = useState("Roboto")
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [publishDate, setPublishDate] = useState("")
  const [publishTime, setPublishTime] = useState("")
  const editorRef = useRef(null)

  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || ""
      setCharCount(text.length)
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    font,
    setFont,
    charCount,
    wordCount,
    publishDate,
    setPublishDate,
    publishTime,
    setPublishTime,
    editorRef,
    updateCounts,
  }
}
