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
  
  // State management
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [publishedBlogSlug, setPublishedBlogSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initialContent, setInitialContent] = useState('')
  const [existingBlogStatus, setExistingBlogStatus] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const calendarRef = useRef(null)
  const autoSaveRef = useRef(false)

  // Track unsaved changes
  useEffect(() => {
    if (blogTitle || blogDescription || (editorContent.html && editorContent.html !== '<p></p>')) {
      setHasUnsavedChanges(true)
    }
  }, [blogTitle, blogDescription, editorContent.html])

  // Auto-save as draft when leaving the page (only for new blogs)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if there are unsaved changes and it's a new blog
      if (hasUnsavedChanges && !blogId && blogTitle.trim()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Auto-save as draft when component unmounts (user navigates away)
      if (hasUnsavedChanges && !blogId && !autoSaveRef.current && blogTitle.trim() && blogDescription.trim() && editorContent.html && editorContent.html !== '<p></p>') {
        autoSaveRef.current = true
        // Use sendBeacon for reliable save on page unload
        const blogData = {
          title: blogTitle,
          description: blogDescription,
          content: editorContent.html,
          categories: selectedCategories,
          status: 'draft',
          published: false
        }
        
        navigator.sendBeacon(
          `${API_URL}/api/blogs/auto-save`,
          new Blob([JSON.stringify(blogData)], { type: 'application/json' })
        )
      }
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
      alert('Failed to load blog for editing')
    } finally {
      setIsLoading(false)
    }
  }

  // Save blog to database (create new or update existing)
  const saveBlog = async (status, scheduledAt = null) => {
    if (!blogTitle.trim()) {
      alert('Please enter a title for your blog')
      return false
    }
    if (!blogDescription.trim()) {
      alert('Please enter a description for your blog')
      return false
    }
    if (!editorContent.html || editorContent.html === '<p></p>') {
      alert('Please write some content for your blog')
      return false
    }

    setIsSaving(true)
    try {
      const blogData = {
        title: blogTitle,
        description: blogDescription,
        content: editorContent.html,
        categories: selectedCategories,
        status: status,
        published: status === 'published'
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

      // Mark as saved to prevent auto-save on exit
      setHasUnsavedChanges(false)
      
      return responseData
    } catch (error) {
      console.error('Error saving blog:', error)
      alert(error.message || 'Failed to save blog')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Save to Draft
  const handleSaveDraft = async () => {
    const result = await saveBlog('draft')
    if (result) {
      window.location.href = '/draft?refresh=true'
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

  // Handle Schedule
  const handleSchedule = async () => {
    if (!selectedDate) {
      alert('Please select a date and time to schedule')
      return
    }

    // Create scheduled datetime from selected date and time
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(selectedHour, selectedMinute, 0, 0)

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      alert('Please select a future date and time')
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
      
      {/* Fixed Right Vertical Line */}
      <div className="hidden md:block fixed top-0 bottom-0 w-px bg-gray-200 z-[150]" style={{ left: 'calc(50% + 468px)' }} />

      <div className="w-full min-h-screen bg-white flex justify-center overflow-x-hidden">
        {/* Left Sidebar Area */}
        <div className="hidden md:block w-[512px] flex-shrink-0" />

        {/* Center Content Area */}
        <div className="w-[916px] flex-shrink-0">
          {/* Header Section */}
          <div className="flex flex-col w-[916px] h-[152px] gap-2.5 pt-6 pr-8 pb-6 pl-8 border-b border-gray-200">
            {/* Title Block */}
            <div className="flex flex-col w-[282px] h-[104px] gap-4">
              {/* Drafts Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200 w-fit">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-gray-500 text-sm">Drafts</span>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Title of the Blog..."
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                className="w-[271px] h-[38px] text-3xl font-semibold bg-transparent placeholder:text-gray-300 focus:outline-none border-0 p-0"
              />

              {/* Description Input */}
              <input
                type="text"
                placeholder="Write your Short Description for your Blog..."
                value={blogDescription}
                onChange={(e) => setBlogDescription(e.target.value)}
                className="w-[282px] h-4 text-sm text-gray-500 bg-transparent placeholder:text-gray-400 focus:outline-none border-0 p-0"
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
        <div className="flex items-center w-[180px] h-[39px] gap-3.5 py-2.5 px-3.5 bg-gray-100 border border-gray-200 text-sm text-gray-700 whitespace-nowrap">
          <span>Chars <strong>{editorContent.charCount}</strong></span>
          <span className="border-l border-gray-300 h-5"></span>
          <span>Words <strong>{editorContent.wordCount}</strong></span>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-[72px] flex items-center justify-center bg-white rounded-lg pt-4 pr-4 pb-6 pl-4 shadow-lg z-[100]">
        <div className="flex items-center justify-center gap-4 h-8">
          <button 
            className="flex items-center justify-center gap-3 w-40 h-8 rounded border border-gray-200 bg-gray-100 px-6 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <img src="/images/icons/Draft.svg" alt="Save to draft" className="w-5 h-5" />
            <span className="whitespace-nowrap font-normal text-sm text-gray-900">
              {isSaving ? 'Saving...' : 'Save to draft'}
            </span>
          </button>
          
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
              className="text-sm text-gray-400 flex-shrink-0 h-full flex items-center justify-center bg-gray-100 border-l border-gray-200 cursor-pointer px-3"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              Schedule
            </span>
          </div>
        </div>
      </div>

      {/* Character/Word Count and Publish Controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#fff] border-t border-gray-200 ${(isThumbnailModalOpen || isImageModalOpen) ? 'hidden' : ''}`} style={{zIndex:999}}>
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-4">
          {/* Character/Word Count */}
          <div className="flex justify-end">
            <div className="text-sm text-gray-400">
              <span>Chars <span className="text-gray-600">{charCount}</span></span>
              <span className="mx-2">|</span>
              <span>Words <span className="text-gray-600">{wordCount}</span></span>
            </div>
          </div>

          {/* Publish Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3">
            {/* Mobile Layout */}
            <div className="flex md:hidden items-center gap-2 w-full">
              {articleStatus === 'trash' ? (
                <Button 
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Reverting...' : 'Revert to draft'}
                </Button>
              ) : articleStatus === 'review' ? (
                <Button 
                  onClick={handleSendForReview}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Sending...' : 'Send for Review'}
                </Button>
              ) : articleStatus === 'published' ? (
                <Button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium flex-1"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                  </Button>
                  <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleReschedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                  >
                    {isLoading ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                </>
              ) : (
                <>
                  {!isPublicationOwner ? (
                    // For joined publications where user is NOT owner - only show Send for Review button
                    <Button 
                      onClick={handleSendForReview}
                      disabled={isLoading}
                      className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg text-sm font-medium"
                    >
                      {isLoading ? 'Sending...' : 'Send for Review'}
                    </Button>
                  ) : (
                    // For owned publications - show all buttons
                    <>
                      <Button 
                        onClick={handlePublish}
                        disabled={isLoading}
                        className="bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium"
                      >
                        {isLoading ? 'Publishing...' : 'Publish'}
                      </Button>
                      <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-lg flex-1">
                        <Input
                          type="text"
                          value={publishDate}
                          onChange={handleDateChange}
                          placeholder="dd-mm-yyyy" maxLength={10}
                          className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                        />
                        <Input
                          type="text"
                          value={publishTime}
                          onChange={handleTimeChange}
                          placeholder="--:--" maxLength={5}
                          className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center"
                        />
                        <button
                          onClick={() => setIsDateTimePickerOpen(true)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                      <button 
                        onClick={handleSchedule}
                        disabled={isLoading}
                        className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg"
                      >
                        {isLoading ? 'Scheduling...' : 'Schedule'}
                      </button>
                      <Button 
                        onClick={handleSaveDraft}
                        disabled={isLoading}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium"
                      >
                        {isLoading ? 'Saving...' : 'Save as Draft'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {articleStatus === 'trash' ? (
                <button 
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Reverting...' : 'Revert to draft'}
                </button>
              ) : articleStatus === 'review' ? (
                <button 
                  onClick={handleSendForReview}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 flex items-center justify-center px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Sending...' : 'Send for Review'}
                </button>
              ) : articleStatus === 'published' ? (
                <button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-black text-white hover:bg-gray-800 flex justify-center items-center gap-2 px-6 py-2 rounded text-sm font-medium h-8"
                  style={{ width: '160px' }}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                  <img src="/editor-icons/publish.svg" alt="Update" className="h-4 w-4" />
                </button>
              ) : articleStatus === 'scheduled' ? (
                <>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    <FileText className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save to draft'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                    style={{ width: '160px', padding: '8px 24px' }}
                  >
                    {isLoading ? 'Publishing...' : 'Publish Now'}
                    <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                  </button>
                  <div className="flex items-center bg-white px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 h-8" style={{ width: '200px' }}>
                    <Input
                      type="text"
                      value={publishDate}
                      onChange={handleDateChange}
                      placeholder="dd-mm-yyyy" maxLength={10}
                      className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 p-0"
                    />
                    <Input
                      type="text"
                      value={publishTime}
                      onChange={handleTimeChange}
                      placeholder="--:--" maxLength={5}
                      className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center p-0"
                    />
                    <button
                      onClick={() => setIsDateTimePickerOpen(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                  <button 
                    onClick={handleReschedule}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium h-8 rounded"
                    style={{ width: '80px', padding: '8px 5px' }}
                  >
                    {isLoading ? 'Rescheduling...' : 'Schedule'}
                  </button>
                </>
              ) : (
                <>
                  {!isPublicationOwner ? (
                    // For joined publications where user is NOT owner - only show Send for Review button
                    <button 
                      onClick={handleSendForReview}
                      disabled={isLoading}
                      className="bg-black text-white hover:bg-gray-800 flex items-center justify-center text-sm font-medium h-8 rounded"
                      style={{ width: '160px', padding: '8px 24px' }}
                    >
                      {isLoading ? 'Sending...' : 'Send for Review'}
                    </button>
                  ) : (
                    // For owned publications - show all buttons
                    <>
                      <button 
                        onClick={handleSaveDraft}
                        disabled={isLoading}
                        className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                        style={{ width: '160px', padding: '8px 24px' }}
                      >
                        <FileText className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save to draft'}
                      </button>
                      <button 
                        onClick={handlePublish}
                        disabled={isLoading}
                        className="bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium h-8 rounded"
                        style={{ width: '160px', padding: '8px 24px' }}
                      >
                        {isLoading ? 'Publishing...' : 'Publish'}
                        <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                      </button>
                      <div className="flex items-center bg-white px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 h-8" style={{ width: '200px' }}>
                        <Input
                          type="text"
                          value={publishDate}
                          onChange={handleDateChange}
                          placeholder="dd-mm-yyyy" maxLength={10}
                          className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 p-0"
                        />
                        <Input
                          type="text"
                          value={publishTime}
                          onChange={handleTimeChange}
                          placeholder="--:--" maxLength={5}
                          className="w-12 text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700 text-center p-0"
                        />
                        <button
                          onClick={() => setIsDateTimePickerOpen(true)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                      <button 
                        onClick={handleSchedule}
                        disabled={isLoading}
                        className="bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium h-8 rounded"
                        style={{ width: '80px', padding: '8px 5px' }}
                      >
                        {isLoading ? 'Scheduling...' : 'Schedule'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Modal */}
      <ThumbnailModal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        onImageAdd={handleThumbnailAdd}
      />

      {/* Date Time Picker */}
      <DateTimePicker
        isOpen={isDateTimePickerOpen}
        onClose={() => setIsDateTimePickerOpen(false)}
        onDateTimeSelect={handleDateTimeSelect}
        selectedDate={publishDate}
        selectedTime={publishTime}
      />

      {/* Publish Success Modal */}
      <PublishSuccessModal
        isOpen={showPublishSuccessModal}
        onClose={() => setShowPublishSuccessModal(false)}
        blogSlug={publishedBlogSlug}
        blogTitle={title}
      />

      {/* Draft Saved Toast */}
      {showDraftSavedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium">Blog saved as draft</span>
          </div>
        </div>
      )}
    </div>
  )
}
