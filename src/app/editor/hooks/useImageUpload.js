import { useState, useRef } from "react"

export function useImageUpload() {
  const [showImageModal, setShowImageModal] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageTitle, setImageTitle] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const imageInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddImage = () => {
    if (imagePreview) {
      const img = `<img src="${imagePreview}" alt="${imageAlt}" title="${imageTitle}" style="max-width: 100%;" />`
      document.execCommand('insertHTML', false, img)
      resetImageState()
    }
  }

  const resetImageState = () => {
    setImagePreview(null)
    setImageTitle("")
    setImageAlt("")
    setShowImageModal(false)
  }

  return {
    showImageModal,
    setShowImageModal,
    imagePreview,
    imageTitle,
    setImageTitle,
    imageAlt,
    setImageAlt,
    imageInputRef,
    handleImageUpload,
    handleAddImage,
    resetImageState,
  }
}
