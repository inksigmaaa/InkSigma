"use client"

import { useState, useEffect, useRef } from 'react'
import { useArticles } from '@/contexts/ArticlesContext'
import { usePublication } from '@/contexts/PublicationContext'
import { useToast } from '@/contexts/ToastContext'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const BlogStatsComponent = () => {
  const { articles, publicationArticles: contextPublicationArticles } = useArticles()
  const { currentPublication } = usePublication()
  const { showToast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCalendar, setShowCalendar] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [commentCounts, setCommentCounts] = useState({})
  const [viewStats, setViewStats] = useState({})
  
  const periodMenuRef = useRef(null)
  const datePickerRef = useRef(null)
  const calendarRef = useRef(null)
  
  const today = new Date()
  const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom Date']
  
  // Filter articles by current publication first
  // Use context's publicationArticles if available and we have a current publication
  const rawPublicationArticles = currentPublication?.id 
    ? (contextPublicationArticles?.length > 0 ? contextPublicationArticles : articles.filter(article => article.publicationId === currentPublication.id))
    : articles

  const publicationArticles = rawPublicationArticles.filter(article => article.status === 'published')
  
  // Fetch comment counts and view stats for all articles
  useEffect(() => {
    const fetchStats = async () => {
      if (publicationArticles.length === 0) return;
      
      try {
        const blogIds = publicationArticles.map(a => a.id);
        
        // Fetch comment counts
        const commentResponse = await fetch(`${API_URL}/api/comments/counts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogIds })
        });
        
        if (commentResponse.ok) {
          const counts = await commentResponse.json();
          console.log('[BlogStats] Comment counts:', counts);
          setCommentCounts(counts);
        }

        // Fetch view stats
        const viewResponse = await fetch(`${API_URL}/api/views/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogIds })
        });
        
        if (viewResponse.ok) {
          const stats = await viewResponse.json();
          console.log('[BlogStats] View stats:', stats);
          setViewStats(stats);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [publicationArticles])
  
  // Filter articles based on selected period
  const getFilteredArticles = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    return publicationArticles.filter(article => {
      // Parse article date - assuming articles have createdAt or publishedAt field
      const articleDate = new Date(article.createdAt || article.publishedAt || article.created_at)
      articleDate.setHours(0, 0, 0, 0)
      
      switch (selectedPeriod) {
        case 'Today':
          return articleDate.getTime() === now.getTime()
          
        case 'Weekly':
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return articleDate >= weekAgo && articleDate <= now
          
        case 'Monthly':
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return articleDate >= monthAgo && articleDate <= now
          
        case 'Yearly':
          const yearAgo = new Date(now)
          yearAgo.setFullYear(yearAgo.getFullYear() - 1)
          return articleDate >= yearAgo && articleDate <= now
          
        case 'Custom Date':
          if (!fromDate || !toDate) return true
          
          const [fromDay, fromMonth, fromYear] = fromDate.split('/').map(Number)
          const [toDay, toMonth, toYear] = toDate.split('/').map(Number)
          
          const fromDateObj = new Date(fromYear, fromMonth - 1, fromDay)
          const toDateObj = new Date(toYear, toMonth - 1, toDay)
          
          fromDateObj.setHours(0, 0, 0, 0)
          toDateObj.setHours(23, 59, 59, 999)
          
          return articleDate >= fromDateObj && articleDate <= toDateObj
          
        default:
          return true
      }
    })
  }

  // Calculate dynamic stats based on filtered articles
  const calculateStats = () => {
    const filteredArticles = getFilteredArticles()
    const totalArticles = filteredArticles.length
    const totalViews = filteredArticles.reduce((sum, article) => {
      const views = viewStats[article.id]?.views || article.views || 0;
      return sum + views;
    }, 0)
    const totalComments = filteredArticles.reduce((sum, article) => sum + (commentCounts[article.id] || 0), 0)
    const totalShares = filteredArticles.reduce((sum, article) => {
      const shares = viewStats[article.id]?.shares || article.shares || 0;
      return sum + shares;
    }, 0)
    
    return {
      totalArticles,
      views: totalViews,
      comments: totalComments,
      shares: totalShares
    }
  }

  const stats = calculateStats()

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    const days = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ 
        day: daysInPrevMonth - i, 
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        isCurrentMonth: true,
        date: new Date(year, month, i)
      })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ 
        day: i, 
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      })
    }

    return days
  }

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleDateSelect = (date) => {
    const formatted = formatDate(date)
    if (showCalendar === 'from') {
      // If 'to' date exists, ensure 'from' is not after 'to'
      if (toDate) {
        const [toDay, toMonth, toYear] = toDate.split('/').map(Number)
        const toDateObj = new Date(toYear, toMonth - 1, toDay)
        if (date > toDateObj) {
          showToast('From date cannot be after To date', 'error')
          return
        }
      }
      setFromDate(formatted)
    } else if (showCalendar === 'to') {
      // If 'from' date exists, ensure 'to' is not before 'from'
      if (fromDate) {
        const [fromDay, fromMonth, fromYear] = fromDate.split('/').map(Number)
        const fromDateObj = new Date(fromYear, fromMonth - 1, fromDay)
        if (date < fromDateObj) {
          showToast('To date cannot be before From date', 'error')
          return
        }
      }
      setToDate(formatted)
    }
    setShowCalendar(null)
  }

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1))
  }

  const days = getDaysInMonth(currentDate)

  // Close period menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
        setShowPeriodMenu(false)
      }
    }

    if (showPeriodMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPeriodMenu])

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker && !showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker, showCalendar])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(null)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  return (
    <div className="w-full">
      {/* Period Selector */}
      <div ref={periodMenuRef} className="mb-4 relative -mt-10 max-lg:hidden">
        <button
          onClick={() => setShowPeriodMenu(!showPeriodMenu)}
          className="flex items-center gap-2 text-gray-900 font-medium text-sm bg-neutral-100 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors border border-gray-200"
        >
          {selectedPeriod}
          <span className="text-xs text-neutral-400">▼</span>
        </button>

        {showPeriodMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border py-2 z-10 w-36">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => {
                  if (period === 'Custom Date') {
                    setShowDatePicker(true)
                  } else {
                    setSelectedPeriod(period)
                  }
                  setShowPeriodMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  period === 'Custom Date' ? 'text-[#B0B0B0] font-semibold' : 'text-[#696969]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && !showCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
            <div 
              ref={datePickerRef} 
              className="bg-white rounded-lg shadow-xl relative z-[10000]"
              style={{ width: '276px', padding: '32px' }}
            >
              <div className="flex flex-col" style={{ gap: '29px' }}>
                <div className="flex" style={{ gap: '32px' }}>
                  <div className="flex-1">
                    <label 
                      className="block text-[#2E2E2E] font-semibold mb-2 cursor-pointer"
                      style={{ 
                        fontFamily: 'Public Sans',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '100%'
                      }}
                      onClick={() => setShowCalendar('from')}
                    >
                      From
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={fromDate}
                      readOnly
                      className="w-full border-b-[2px] border-[#CBCBCB] text-[#C8C8C8] outline-none cursor-pointer bg-transparent"
                      style={{ 
                        fontFamily: 'Public Sans',
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '150%',
                        paddingBottom: '4px'
                      }}
                      onClick={() => setShowCalendar('from')}
                    />
                  </div>
                  <div className="flex-1">
                    <label 
                      className="block text-[#2E2E2E] font-semibold mb-2 cursor-pointer"
                      style={{ 
                        fontFamily: 'Public Sans',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '100%'
                      }}
                      onClick={() => setShowCalendar('to')}
                    >
                      To
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={toDate}
                      readOnly
                      className="w-full border-b-[2px] border-[#CBCBCB] text-[#C8C8C8] outline-none cursor-pointer bg-transparent"
                      style={{ 
                        fontFamily: 'Public Sans',
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '150%',
                        paddingBottom: '4px'
                      }}
                      onClick={() => setShowCalendar('to')}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDatePicker(false)
                    setShowCalendar(null)
                    setSelectedPeriod('Custom Date')
                  }}
                  className="rounded hover:opacity-90 transition-opacity flex items-center justify-center"
                  style={{
                    width: '59px',
                    height: '30px',
                    borderRadius: '4px',
                    backgroundColor: '#F3EEFF',
                    fontFamily: 'Public Sans',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '150%',
                    padding: '0'
                  }}
                >
                  <span
                    style={{
                      backgroundImage: 'linear-gradient( #A941FB, #7864F0EB 92%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'block'
                    }}
                  >
                    Apply
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
            <div 
              ref={calendarRef} 
              className="bg-gray-100 rounded-2xl shadow-2xl relative z-[10000] font-['Public_Sans'] font-normal text-sm leading-normal tracking-normal text-[#696969]"
              style={{ width: '260px', padding: '20px' }}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => changeMonth(-1)}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div className="font-['Public_Sans'] font-semibold text-sm leading-normal tracking-normal text-[#696969]">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7" style={{ gap: '10px', marginBottom: '10px' }}>
                {daysOfWeek.map(day => (
                  <div 
                    key={day} 
                    className="font-['Public_Sans'] font-normal text-sm leading-normal tracking-normal text-[#696969] flex items-center justify-center"
                    style={{ width: '26px', height: '20px', fontSize: '12px' }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7" style={{ gap: '10px' }}>
                {days.map((dayObj, index) => {
                  const isToday = dayObj.isCurrentMonth && 
                    dayObj.day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear()

                  return (
                    <button
                      key={index}
                      onClick={() => dayObj.isCurrentMonth && handleDateSelect(dayObj.date)}
                      disabled={!dayObj.isCurrentMonth}
                      className={`text-center rounded-lg flex items-center justify-center font-medium transition-colors
                        ${dayObj.isCurrentMonth 
                          ? isToday 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                          : 'bg-white text-gray-300'
                        }`}
                      style={{ width: '26px', height: '26px', fontSize: '14px' }}
                    >
                      {dayObj.day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid  grid-cols-5 px-8 max-lg:hidden">
        <div >
          <div className="text-[32px]  font-extrabold text-[#292929] leading-none">{stats.totalArticles}</div>
          <div className="text-xs font-semibold bg-[linear-gradient(#A941FB,#7864F0_92%)] bg-clip-text text-transparent">Total no. Articles</div>
        </div>
        <div>
          <div className="text-[32px] font-extrabold text-[#292929] leading-none ">{stats.views}</div>
          <div className="text-xs font-semibold bg-[linear-gradient(#A941FB,#7864F0_92%)] bg-clip-text text-transparent">Views</div>
        </div>
        <div>
          <div className="text-[32px] font-extrabold text-[#292929] leading-none">{stats.comments}</div>
          <div className="text-xs font-semibold bg-[linear-gradient(#A941FB,#7864F0_92%)] bg-clip-text text-transparent">Comments</div>
        </div>
        <div>
          <div className="text-[32px] font-extrabold text-[#292929] leading-none">{stats.shares}</div>
          <div className="text-xs font-semibold bg-[linear-gradient(#A941FB,#7864F0_92%)] bg-clip-text text-transparent">Shares</div>
        </div>
      </div>
    </div>
  )
}

export default BlogStatsComponent
