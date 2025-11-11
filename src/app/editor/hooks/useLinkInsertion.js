import { useState } from "react"

export function useLinkInsertion() {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState("http://")
  const [linkText, setLinkText] = useState("")
  const [linkNewTab, setLinkNewTab] = useState(false)
  const [linkNoFollow, setLinkNoFollow] = useState(false)

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      const target = linkNewTab ? ' target="_blank"' : ''
      const rel = linkNoFollow ? ' rel="nofollow"' : ''
      const linkHTML = `<a href="${linkUrl}"${target}${rel}>${linkText}</a>`
      document.execCommand('insertHTML', false, linkHTML)
      resetLinkState()
    }
  }

  const resetLinkState = () => {
    setLinkUrl("http://")
    setLinkText("")
    setLinkNewTab(false)
    setLinkNoFollow(false)
    setShowLinkModal(false)
  }

  return {
    showLinkModal,
    setShowLinkModal,
    linkUrl,
    setLinkUrl,
    linkText,
    setLinkText,
    linkNewTab,
    setLinkNewTab,
    linkNoFollow,
    setLinkNoFollow,
    handleInsertLink,
  }
}
