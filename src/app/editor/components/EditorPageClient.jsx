"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryDropdown } from "./CategoryDropdown"
import { ThumbnailModal } from "./ThumbnailModal"
import { DateTimePicker } from "./DateTimePicker"
import PublishSuccessModal from "./PublishSuccessModal"
import { useArticles } from "@/contexts/ArticlesContext"
import { useSession } from "@/lib/auth-client"
import { usePublication } from "@/contexts/PublicationContext"

import { 
  Image as ImageIcon,
  Calendar,
  ChevronLeft,
  FileText,
} from "lucide-react"

import { TiptapEditor } from "./TiptapEditor"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const categories = [
  "Fashion",
  "Space", 
  "Sports",
  "Art",
  "Humor",
  "Climate & Environment",
  "Technology",
  "Business",
  "Health",
  "Education"
]

export default function EditorPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { createArticle, updateArticle, uploadArticleImage, getArticleById, loadUserArticles } = useArticles()
  const { currentPublication } = usePublication()
  
  // Prevent hydration mismatch by ensuring client-side rendering
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Get status and ID from URL parameters
  const articleStatus = searchParams.get('status')
  const articleId = searchParams.get('id')
  const blogId = articleId // Alias for backward compatibility
  const publicationId = searchParams.get('publicationId') // For joined publications
  
  // Determine if user is owner or member
  const isPublicationOwner = currentPublication?.isOwner ?? true // Default to true if no publication context
  
  // Debug log
  useEffect(() => {
    console.log('Editor - publicationId:', publicationId)
    console.log('Editor - articleStatus:', articleStatus)
    console.log('Editor - isPublicationOwner:', isPublicationOwner)
    console.log('Editor - currentPublication:', currentPublication)
  }, [publicationId, articleStatus, isPublicationOwner, currentPublication])

  // Check if user has a publication, redirect to create one if not
  useEffect(() => {
    const checkPublication = async () => {
      if (!session?.user?.id) return
      
      // If we already have a publication from context or URL, no need to check
      if (currentPublication?.id || publicationId) return
      
      try {
        const response = await fetch(`${API_URL}/api/publications/user/${session.user.id}`, {
          credentials: 'include'
        })
        
        if (response.status === 404) {
          // User has no publication, redirect to create one
          router.push('/create-publication')
        }
      } catch (error) {
        console.error('Error checking publication:', error)
      }
    }
    
    checkPublication()
  }, [session?.user?.id, currentPublication?.id, publicationId, router])
  
  // State management
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [categorySearch, setCategorySearch] = useState('')
  const [showThumbnailModal, setShowThumbnailModal] = useState(false)
  const [thumbnailData, setThumbnailData] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHour, setSelectedHour] = useState(10)
  const [selectedMinute, setSelectedMinute] = useState(30)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [editorContent, setEditorContent] = useState({ charCount: 0, wordCount: 0, html: '', text: '' })
  const [blogTitle, setBlogTitle] = useState('')
  const [blogDescription, setBlogDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [publishedBlogSlug, setPublishedBlogSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initialContent, setInitialContent] = useState('')
  const [existingBlogStatus, setExistingBlogStatus] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const calendarRef = useRef(null)
  const savedSuccessfullyRef = useRef(false)

  // Reset save status to idle when content changes
  useEffect(() => {
    if (saveStatus === 'saved') {
      setSaveStatus('idle')
    }
  }, [blogTitle, blogDescription, editorContent.html])

  // Track unsaved changes
  useEffect(() => {
    if (blogTitle || blogDescription || (editorContent.html && editorContent.html !== '<p></p>')) {
      setHasUnsavedChanges(true)
    }
  }, [blogTitle, blogDescription, editorContent.html])

  // Show warning when leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if there are unsaved changes, it's a new blog, and not already saved
      if (hasUnsavedChanges && !blogId && blogTitle.trim() && !savedSuccessfullyRef.current) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, blogId, blogTitle, blogDescription, editorContent.html, selectedCategories])

  // Load existing blog if editing
  useEffect(() => {
    if (blogId) {
      loadExistingBlog(blogId)
    }
  }, [blogId])

  const loadExistingBlog = async (id) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/blogs/${id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load blog')
      }
      
      const blog = await response.json()
      console.log('Loaded blog for editing:', blog)
      
      setBlogTitle(blog.title || '')
      setBlogDescription(blog.description || '')
      setSelectedCategories(blog.categories || [])
      setInitialContent(blog.content || '')
      setExistingBlogStatus(blog.status)
      
      if (blog.image) {
        setThumbnailData({ url: blog.image })
      }
      
      if (blog.scheduledAt) {
        const scheduledDate = new Date(blog.scheduledAt)
        setSelectedDate(scheduledDate)
        setSelectedHour(scheduledDate.getHours())
        setSelectedMinute(scheduledDate.getMinutes())
      }
    } catch (error) {
      console.error('Error loading blog:', error)
      // alert('Failed to load blog for editing')
    } finally {
      setIsLoading(false)
    }
  }

  // Save blog to database (create new or update existing)
  const saveBlog = async (status, scheduledAt = null, skipValidation = false) => {
    // Skip validation when reverting to draft or updating existing published articles
    // Also skip validation if blog already exists (updating)
    if (!skipValidation && !blogId) {
      if (!blogTitle.trim()) {
        console.warn('Validation failed: Missing title')
        return false
      }
      if (!blogDescription.trim()) {
        console.warn('Validation failed: Missing description')
        return false
      }
    }

    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const blogData = {
        title: blogTitle,
        description: blogDescription,
        content: editorContent.html,
        categories: selectedCategories,
        status: status,
        published: status === 'published'
      }

      // Add publicationId if available
      const pubId = publicationId || currentPublication?.id
      if (pubId) {
        blogData.publicationId = parseInt(pubId)
        console.log('Blog will be assigned to publication:', pubId)
      } else {
        console.warn('No publication ID available - blog may not be assigned to correct publication')
        console.warn('publicationId from URL:', publicationId)
        console.warn('currentPublication:', currentPublication)
      }

      // Add scheduledAt if scheduling
      if (scheduledAt) {
        blogData.scheduledAt = scheduledAt.toISOString()
      }

      console.log('Saving blog with data:', blogData, 'blogId:', blogId)

      // Use PUT for updates, POST for new blogs
      const url = blogId ? `${API_URL}/api/blogs/${blogId}` : `${API_URL}/api/blogs`
      const method = blogId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(blogData)
      })

      console.log('Response status:', response.status)
      
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save blog')
      }

      // Upload thumbnail if one was selected
      if (thumbnailData && thumbnailData.file) {
        try {
          console.log('Uploading thumbnail for blog:', responseData.id)
          await uploadArticleImage(responseData.id, thumbnailData.file)
          console.log('Thumbnail uploaded successfully')
        } catch (error) {
          console.error('Error uploading thumbnail:', error)
          // Don't fail the whole save if thumbnail upload fails
        }
      }

      // Mark as saved to prevent auto-save on exit
      setHasUnsavedChanges(false)
      savedSuccessfullyRef.current = true
      setSaveStatus('saved')
      
      return responseData
    } catch (error) {
      console.error('Error saving blog:', error)
      setSaveStatus('idle')
      // alert(error.message || 'Failed to save blog')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Save to Draft (without redirect - just save and stay on page)
  const handleSave = async () => {
    const result = await saveBlog(existingBlogStatus || 'draft', null, true)
    if (result && existingBlogStatus === 'published') {
      // For published articles, redirect to published page
      window.location.href = '/published?refresh=true'
    }
  }

  // Handle Save to Draft (with redirect)
  const handleSaveDraft = async () => {
    const result = await saveBlog('draft')
    if (result) {
      window.location.href = '/draft?refresh=true'
    }
  }

  // Handle Revert to Draft (for published articles)
  const handleDraft = async () => {
    const result = await saveBlog('draft', null, true)
    if (result) {
      window.location.href = '/draft?refresh=true'
    }
  }

  // Handle Revert from Trash to Draft
  const handleRevertFromTrash = async () => {
    try {
      const result = await saveBlog('draft', null, true)
      if (result) {
        window.location.href = '/draft?refresh=true'
      }
    } catch (error) {
      console.error('Error reverting from trash:', error)
    }
  }

  // Handle Publish
  const handlePublish = async () => {
    const result = await saveBlog('published')
    if (result) {
      setPublishedBlogSlug(result.slug || '')
      setShowPublishSuccess(true)
    }
  }

  // Handle Send for Review (for editors/authors in joined publications)
  const handleSendForReview = async () => {
    const result = await saveBlog('review', null, true)
    if (result) {
      console.log('Article sent for review!')
      
      // Determine redirection path based on role
      const role = currentPublication?.role
      const isOwner = currentPublication?.isOwner
      const isReviewer = isOwner || role === 'editor' || role === 'admin'
      const targetPath = isReviewer ? '/review' : '/author-review'
      
      // Include publication ID in URL to stay in joined publication context
      const pubId = publicationId || currentPublication?.id
      const redirectUrl = pubId 
        ? `${targetPath}?pub=${pubId}&refresh=true`
        : `${targetPath}?refresh=true`
      window.location.href = redirectUrl
    }
  }

  // Handle Back - Auto-save as draft and go back
  const handleBack = async () => {
    // If there's content to save, auto-save as draft
    if (blogTitle.trim() || blogDescription.trim() || (editorContent.html && editorContent.html !== '<p></p>')) {
      const result = await saveBlog('draft', null, true)
      if (result) {
        router.push('/draft?refresh=true')
        return
      }
    }
    // If nothing to save or save failed, just go back
    router.push('/draft?refresh=true')
  }

  // Handle Schedule
  const handleSchedule = async () => {
    if (!selectedDate) {
      console.warn('Validation failed: Missing scheduled date')
      return
    }

    // Create scheduled datetime from selected date and time
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(selectedHour, selectedMinute, 0, 0)

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      console.warn('Validation failed: Scheduled time must be in future')
      return
    }

    const result = await saveBlog('scheduled', scheduledDateTime)
    if (result) {
      setShowCalendar(false)
      window.location.href = '/schedule?refresh=true'
    }
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  )

  // Calendar helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay()
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"]

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateSelect = (day) => {
    const newDate = new Date(currentYear, currentMonth, day)
    setSelectedDate(newDate)
    const dayStr = String(day).padStart(2, '0')
    const monthStr = String(currentMonth + 1).padStart(2, '0')
    setManualDate(`${dayStr}-${monthStr}-${currentYear}`)
    const hourStr = String(selectedHour).padStart(2, '0')
    const minuteStr = String(selectedMinute).padStart(2, '0')
    setManualTime(`${hourStr}:${minuteStr}`)
  }

  const handleClearDate = () => {
    setSelectedDate(null)
    setSelectedHour(10)
    setSelectedMinute(30)
    setManualDate('')
    setManualTime('')
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    const dayStr = String(today.getDate()).padStart(2, '0')
    const monthStr = String(today.getMonth() + 1).padStart(2, '0')
    setManualDate(`${dayStr}-${monthStr}-${today.getFullYear()}`)
    const hourStr = String(selectedHour).padStart(2, '0')
    const minuteStr = String(selectedMinute).padStart(2, '0')
    setManualTime(`${hourStr}:${minuteStr}`)
  }

  const formatSelectedDateTime = () => {
    if (!selectedDate) return ""
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const year = selectedDate.getFullYear()
    const hour = String(selectedHour).padStart(2, '0')
    const minute = String(selectedMinute).padStart(2, '0')
    return `${day}-${month}-${year}   ${hour}:${minute}`
  }

  const handleManualInput = (e) => {
    let value = e.target.value
    
    // Only allow numbers and dashes
    value = value.replace(/[^0-9\-]/g, '')
    
    // Remove all formatting to get just numbers
    const numbersOnly = value.replace(/[^0-9]/g, '')
    
    // If input is empty, clear the selected date
    if (numbersOnly === '') {
      setManualDate('')
      setSelectedDate(null)
      return
    }
    
    // Auto-format as user types: dd-mm-yyyy
    let formatted = ''
    for (let i = 0; i < numbersOnly.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formatted += '-'
      }
      formatted += numbersOnly[i]
    }
    
    setManualDate(formatted)
    
    // Validate and set date when complete (8 digits: ddmmyyyy)
    if (numbersOnly.length === 8) {
      const day = parseInt(numbersOnly.substring(0, 2))
      const month = parseInt(numbersOnly.substring(2, 4))
      const year = parseInt(numbersOnly.substring(4, 8))
      
      // Validate ranges
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
        const parsedDate = new Date(year, month - 1, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (parsedDate >= today) {
          setSelectedDate(parsedDate)
          setCurrentMonth(parsedDate.getMonth())
          setCurrentYear(parsedDate.getFullYear())
        }
      }
    }
  }

  const handleTimeInput = (e) => {
    let value = e.target.value
    
    // Only allow numbers and colons
    value = value.replace(/[^0-9:]/g, '')
    
    // Remove all formatting to get just numbers
    const numbersOnly = value.replace(/[^0-9]/g, '')
    
    // If input is empty, reset time
    if (numbersOnly === '') {
      setManualTime('')
      return
    }
    
    // Auto-format as user types: hh:mm
    let formatted = ''
    for (let i = 0; i < numbersOnly.length && i < 4; i++) {
      if (i === 2) {
        formatted += ':'
      }
      formatted += numbersOnly[i]
    }
    
    setManualTime(formatted)
    
    // Validate and set time when complete (4 digits: hhmm)
    if (numbersOnly.length === 4) {
      const hour = parseInt(numbersOnly.substring(0, 2))
      const minute = parseInt(numbersOnly.substring(2, 4))
      
      // Validate ranges
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        setSelectedHour(hour)
        setSelectedMinute(minute)
      }
    }
  }

  const getDisplayDate = () => {
    if (manualDate) return manualDate
    if (!selectedDate) return ""
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const year = selectedDate.getFullYear()
    return `${day}-${month}-${year}`
  }

  const getDisplayTime = () => {
    if (manualTime) return manualTime
    return ""
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Day labels
    dayLabels.forEach((label, i) => {
      days.push(
        <div key={`label-${i}`} className="w-6 h-6 flex items-center justify-center text-xs text-gray-500 font-medium">
          {label}
        </div>
      )
    })
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6" />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentYear, currentMonth, day)
      dateToCheck.setHours(0, 0, 0, 0)
      const isPast = dateToCheck < today
      
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(day)}
          disabled={isPast}
          className={`w-6 h-6 flex items-center justify-center text-xs rounded-full transition-colors
            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-purple-100'}`}
          style={isSelected ? { backgroundColor: '#4B6CFB', color: 'white' } : {}}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const handleThumbnailAdd = (data) => {
    setThumbnailData(data)
    console.log('Thumbnail added:', data)
  }

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="overflow-x-hidden">
      {/* Fixed Left Vertical Line */}
      <div className="hidden md:block fixed top-0 bottom-0 w-px bg-gray-200 z-[150]" style={{ left: 'calc(50% - 448px)' }} />
      
      {/* Fixed Back Button - Left of vertical line */}
      <button 
        onClick={handleBack}
        className="hidden md:flex fixed items-center text-gray-500 hover:text-gray-700 transition-colors z-[151]"
        style={{ 
          left: 'calc(50% - 560px)', 
          top: '24px',
          width: '83.5px',
          height: '24px',
          padding: '4px 8px',
          gap: '8px'
        }}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>
      
      {/* Fixed Right Vertical Line */}
      <div className="hidden md:block fixed top-0 bottom-0 w-px bg-gray-200 z-[150]" style={{ left: 'calc(50% + 468px)' }} />

      <div className="w-full min-h-screen bg-white flex justify-center overflow-x-hidden">
        {/* Left Sidebar Area */}
        <div className="hidden md:block w-[512px] flex-shrink-0" />

        {/* Center Content Area */}
        <div className="w-[916px] flex-shrink-0">
          {/* Header Section */}
          <div className="flex flex-col w-[916px] gap-2.5 pt-6 pr-8 pb-6 pl-8 border-b border-gray-200">
            {/* Title Block */}
            <div className="flex flex-col w-full gap-4">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200 w-fit">
                <div className={`w-2 h-2 rounded-full ${
                  existingBlogStatus === 'published' ? 'bg-green-500' : 
                  existingBlogStatus === 'scheduled' ? 'bg-blue-400' : 
                  existingBlogStatus === 'trash' ? 'bg-red-500' :
                  'bg-orange-400'
                }`}></div>
                <span className="text-gray-500 text-sm">
                  {existingBlogStatus === 'published' ? 'Published' : 
                   existingBlogStatus === 'scheduled' ? 'Scheduled' : 
                   existingBlogStatus === 'trash' ? 'Trash' :
                   existingBlogStatus === 'review' ? 'In Review' :
                   'Drafts'}
                </span>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Title of the Blog..."
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                className="w-full text-3xl font-semibold bg-transparent placeholder:text-gray-300 focus:outline-none border-0 p-0"
              />

              {/* Description Input */}
              <input
                type="text"
                placeholder="Write your Short Description for your Blog..."
                value={blogDescription}
                onChange={(e) => setBlogDescription(e.target.value)}
                className="w-full text-sm text-gray-500 bg-transparent placeholder:text-gray-400 focus:outline-none border-0 p-0"
              />
            </div>
          </div>

          {/* Category/Toolbar Section */}
          <div className="flex flex-col w-[916px] h-16 p-4 gap-2 bg-[#FEFEFE] border-b border-gray-200">
            {/* Category and Thumbnail Row */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  className="flex items-center w-[115px] h-8 gap-2.5 rounded border border-gray-200 bg-white text-sm px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  Category
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Category Dropdown */}
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[283px] h-[244px] p-2 rounded-lg bg-[#FEFEFE] border border-gray-200 shadow-lg z-[1000] flex flex-col gap-1">
                    {/* Search and Apply Row */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Search Category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-[204px] h-[30px] px-3 py-2 rounded border border-gray-200 text-sm outline-none bg-gray-50"
                      />
                      <button
                        onClick={() => setShowCategoryDropdown(false)}
                        className="w-[59px] h-[30px] p-2.5 rounded bg-purple-100 border-none cursor-pointer flex items-center justify-center"
                      >
                        <span className="font-medium text-sm bg-gradient-to-br from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                          Apply
                        </span>
                      </button>
                    </div>
                    
                    {/* Category List */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredCategories.map((category) => (
                        <label 
                          key={category}
                          className="flex items-center w-[204px] h-[29px] gap-2.5 rounded px-2 py-1 bg-[#FEFEFE] cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 rounded border border-gray-300 accent-purple-500"
                          />
                          <span className="font-normal text-sm text-gray-800">
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                className="flex items-center w-[180px] h-8 gap-2 rounded border border-gray-200 bg-white text-sm px-4 py-2 hover:bg-gray-50 transition-colors whitespace-nowrap"
                onClick={() => setShowThumbnailModal(true)}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Thumbnail Image
              </button>

              <div className="ml-auto flex items-center w-[78px] h-[33px] gap-2 rounded border border-gray-200 px-2 py-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Saved</span>
              </div>
            </div>
          </div>

          {/* Editor Content Area */}
          <div className="w-[917px] bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-gray-500">Loading blog content...</span>
              </div>
            ) : (
              <TiptapEditor 
                key={blogId || 'new'}
                onUpdate={(data) => setEditorContent(data)}
                initialContent={initialContent}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="hidden md:block w-[490px] flex-shrink-0" />
      </div>

      {/* Bottom Stats Bar */}
      <div className="fixed flex items-center justify-end bg-white border-t border-gray-200 w-[916px] h-[39px] z-[100]" style={{ bottom: '72px', left: 'calc(50% - 448px)' }}>
        <div className="flex items-center h-[39px]">
          <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 text-sm text-gray-700 whitespace-nowrap">
            <span>Chars <strong className="ml-1">{editorContent.charCount}</strong></span>
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 text-sm text-gray-700 whitespace-nowrap">
            <span>Words <strong className="ml-1">{editorContent.wordCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-[72px] flex items-center justify-center bg-white rounded-lg pt-4 pr-4 pb-6 pl-4 shadow-lg z-[100]">
        <div className="flex items-center justify-center gap-4 h-8">
          {/* Show different buttons based on article status */}
          {existingBlogStatus === 'published' ? (
            <>
              <button 
                className="flex items-center justify-center gap-3 w-40 h-8 rounded border border-gray-200 bg-gray-100 px-6 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                onClick={handleDraft}
                disabled={isSaving}
              >
                <img src="/images/icons/Draft.svg" alt="Revert to draft" className="w-5 h-5" />
                <span className="whitespace-nowrap font-normal text-sm text-gray-900">
                  Revert to Draft
                </span>
              </button>
              
              <button 
                className="flex items-center justify-center gap-2 w-40 h-8 rounded bg-gray-900 px-6 py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Updating...' : 'Update'}
              </button>
            </>
          ) : existingBlogStatus === 'trash' ? (
            <>
              <button 
                className="flex items-center justify-center gap-3 w-40 h-8 rounded border border-gray-200 bg-gray-100 px-6 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                onClick={handleRevertFromTrash}
                disabled={isSaving}
              >
                <img src="/images/icons/Draft.svg" alt="Revert to draft" className="w-5 h-5" />
                <span className="whitespace-nowrap font-normal text-sm text-gray-900">
                  Revert to Draft
                </span>
              </button>
            </>
          ) : existingBlogStatus === 'scheduled' ? (
            <>
              <button 
                className="flex items-center justify-center gap-2 w-40 h-8 rounded bg-gray-900 px-6 py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                onClick={handlePublish}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish Now'}
                <img src="/images/icons/Publish.svg" alt="Publish" className="w-4 h-4 brightness-0 invert" />
              </button>

              <div 
                className="flex items-center h-8 border border-gray-200 rounded overflow-hidden"
              >
                <input 
                  type="text" 
                  placeholder="dd-mm-yyyy"
                  value={getDisplayDate()}
                  onChange={handleManualInput}
                  maxLength={10}
                  className="h-[21px] w-[95px] flex-shrink-0 text-sm bg-transparent outline-none pl-2"
                />
                <input 
                  type="text" 
                  placeholder="--:--"
                  value={getDisplayTime()}
                  onChange={handleTimeInput}
                  maxLength={5}
                  className="h-[21px] w-[40px] flex-shrink-0 text-sm bg-transparent outline-none ml-2"
                />
                <svg 
                  className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-pointer mx-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span 
                  className="text-sm text-gray-400 flex-shrink-0 h-full flex items-center justify-center bg-gray-100 border-l border-gray-200 cursor-pointer px-3 hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    if (selectedDate && (manualDate || manualTime)) {
                      handleSchedule()
                    } else {
                      setShowCalendar(!showCalendar)
                    }
                  }}
                >
                  Reschedule
                </span>
              </div>
            </>
          ) : (
            <>
              {/* For editors/authors in joined publications, show "Send for Review" button */}
              {publicationId && currentPublication && !currentPublication.isOwner && (currentPublication.role === 'editor' || currentPublication.role === 'author') ? (
                <button 
                  className="flex items-center justify-center gap-2 w-40 h-8 rounded bg-gray-900 px-6 py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                  onClick={handleSendForReview}
                  disabled={isSaving}
                >
                  {isSaving ? 'Sending...' : 'Send for Review'}
                </button>
              ) : (
                <>
                  <button 
                    className="flex items-center justify-center gap-2 w-40 h-8 rounded bg-gray-900 px-6 py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    onClick={handlePublish}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Publishing...' : 'Publish'}
                    <img src="/images/icons/Publish.svg" alt="Publish" className="w-4 h-4 brightness-0 invert" />
                  </button>

                  <div 
                    className="flex items-center h-8 border border-gray-200 rounded overflow-hidden"
                  >
                    <input 
                      type="text" 
                      placeholder="dd-mm-yyyy"
                      value={getDisplayDate()}
                      onChange={handleManualInput}
                      maxLength={10}
                      className="h-[21px] w-[95px] flex-shrink-0 text-sm bg-transparent outline-none pl-2"
                    />
                    <input 
                      type="text" 
                      placeholder="--:--"
                      value={getDisplayTime()}
                      onChange={handleTimeInput}
                      maxLength={5}
                      className="h-[21px] w-[40px] flex-shrink-0 text-sm bg-transparent outline-none ml-2"
                    />
                    <svg 
                      className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-pointer mx-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span 
                      className="text-sm text-gray-400 flex-shrink-0 h-full flex items-center justify-center bg-gray-100 border-l border-gray-200 cursor-pointer px-3 hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        // If date and time are already set, schedule directly
                        if (selectedDate && (manualDate || manualTime)) {
                          handleSchedule()
                        } else {
                          setShowCalendar(!showCalendar)
                        }
                      }}
                    >
                      Schedule
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div 
          ref={calendarRef}
          className="fixed z-[1001] bg-white rounded flex"
          style={{
            gap: '15px',
            bottom: '88px',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '0.75px solid #B0B0B0',
            boxShadow: '8px 4px 30px 0px rgba(0,0,0,0.15)',
            padding: '16px'
          }}
        >
          {/* Calendar Section */}
          <div className="flex flex-col" style={{ width: '220px', gap: '8px' }}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-800">
                {monthNames[currentMonth]}, {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {renderCalendarDays()}
            </div>
            
            {/* Clear and Today buttons */}
            <div className="flex justify-between">
              <button 
                onClick={handleClearDate}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Clear
              </button>
              <button 
                onClick={handleToday}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Today
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px bg-gray-200" />
          
          {/* Time Picker Section */}
          <div 
            className="flex flex-col"
            style={{ 
              width: '90px', 
              gap: '8px',
              paddingRight: '8px',
              paddingLeft: '8px'
            }}
          >
            {/* Headers */}
            <div className="flex justify-between h-6 items-center" style={{ marginTop: '34px' }}>
              <span className="text-xs text-gray-500 w-7 text-center">Hour</span>
              <span className="text-xs text-gray-500 w-7 text-center">Min</span>
            </div>
            
            {/* Time columns */}
            <div className="flex justify-between" style={{ height: '104px', gap: '16px' }}>
              {/* Hours */}
              <div className="flex flex-col items-center overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {[...Array(24)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedHour(i)
                      const minuteStr = String(selectedMinute).padStart(2, '0')
                      setManualTime(`${String(i).padStart(2, '0')}:${minuteStr}`)
                    }}
                    className={`w-7 h-6 text-xs rounded-md ${selectedHour === i ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    style={{ marginBottom: '2px', flexShrink: 0, ...(selectedHour === i ? { backgroundColor: '#4B6CFB' } : {}) }}
                  >
                    {String(i).padStart(2, '0')}
                  </button>
                ))}
              </div>
              
              {/* Minutes */}
              <div className="flex flex-col items-center overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {[...Array(60)].map((_, m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMinute(m)
                      const hourStr = String(selectedHour).padStart(2, '0')
                      setManualTime(`${hourStr}:${String(m).padStart(2, '0')}`)
                    }}
                    className={`w-7 h-6 text-xs rounded-md ${selectedMinute === m ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    style={{ marginBottom: '2px', flexShrink: 0, ...(selectedMinute === m ? { backgroundColor: '#4B6CFB' } : {}) }}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Apply Button */}
            <button 
              onClick={handleSchedule}
              disabled={isSaving || !selectedDate}
              className="w-full py-1.5 text-sm text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ marginTop: '20px' }}
            >
              {isSaving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Modal */}
      <ThumbnailModal 
        isOpen={showThumbnailModal}
        onClose={() => setShowThumbnailModal(false)}
        onImageAdd={handleThumbnailAdd}
      />

      {/* Publish Success Modal */}
      {showPublishSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div 
            className="relative flex flex-col items-center"
            style={{
              width: '489px',
              height: '323.63px',
              borderRadius: '4px',
              padding: '56px 40px',
              gap: '32px',
              background: '#FEFEFE'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPublishSuccess(false)
                router.push('/published?refresh=true')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Content Area - Icon + Text */}
            <div 
              className="flex flex-col items-center"
              style={{
                width: '357px',
                height: '147.63px',
                gap: '16px'
              }}
            >
              {/* Paper Plane Icon with Checkmark */}
              <div className="relative">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M52 12L28 36M52 12L36 52L28 36M52 12L12 28L28 36" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Published</h2>
                <p className="text-gray-500 text-sm leading-relaxed">Your blog is successfully Published, Click the below<br/>button to view in site</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className="flex items-center"
              style={{
                width: '229px',
                height: '32px',
                gap: '8px'
              }}
            >
              <button
                onClick={() => {
                  setShowPublishSuccess(false)
                  router.push('/published?refresh=true')
                }}
                style={{
                  width: '111px',
                  height: '32px',
                  borderRadius: '4px',
                  background: '#F4F4F4',
                  border: '1px solid #ECECEC'
                }}
                className="flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                See Later
              </button>
              <button
                onClick={() => {
                  setShowPublishSuccess(false)
                  // Navigate to view-site with publicationId
                  const pubId = publicationId || currentPublication?.id
                  if (pubId) {
                    router.push(`/view-site?publicationId=${pubId}`)
                  } else {
                    router.push('/published?refresh=true')
                  }
                }}
                style={{
                  width: '110px',
                  height: '32px',
                  borderRadius: '4px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)'
                }}
                className="flex items-center justify-center text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                View in Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
