"use client"

import { useState, useEffect, useRef } from 'react'
import { useArticles } from '@/contexts/ArticlesContext'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { usePublication } from '@/contexts/PublicationContext'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner";

const BlogStatsComponent = ({ commentCounts = {}, viewStats = {} }) => {
  const { articles, publicationArticles: contextPublicationArticles } = useArticles()
  const { currentPublication } = usePublication()
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCalendar, setShowCalendar] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const periodMenuRef = useRef(null)

  const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom Date']

  // Filter articles by current publication first
  // Use context's publicationArticles if available and we have a current publication
  const rawPublicationArticles = currentPublication?.id
    ? (contextPublicationArticles?.length > 0 ? contextPublicationArticles : articles.filter(article => article.publicationId === currentPublication.id))
    : articles

  const publicationArticles = rawPublicationArticles.filter(article => article.status === 'published')

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

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const parseDate = (value) => {
    if (!value) return undefined
    const [day, month, year] = value.split('/').map(Number)
    if (!day || !month || !year) return undefined
    return new Date(year, month - 1, day)
  }

  const handleDateSelect = (date) => {
    const formatted = formatDate(date)
    if (showCalendar === 'from') {
      // If 'to' date exists, ensure 'from' is not after 'to'
      if (toDate) {
        const [toDay, toMonth, toYear] = toDate.split('/').map(Number)
        const toDateObj = new Date(toYear, toMonth - 1, toDay)
        if (date > toDateObj) {
          toast.error('From date cannot be after To date')
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
          toast.error('To date cannot be before From date')
          return
        }
      }
      setToDate(formatted)
    }
    setShowCalendar(null)
  }

  const selectedCalendarDate = showCalendar === 'from'
    ? parseDate(fromDate)
    : showCalendar === 'to'
      ? parseDate(toDate)
      : undefined

  const openCalendar = (type) => {
    const existingDate = parseDate(type === 'from' ? fromDate : toDate)
    if (existingDate) {
      setCalendarMonth(existingDate)
    }
    setShowCalendar(type)
  }

  // Close period menu when clicking outside
  useOutsideClick(periodMenuRef, () => setShowPeriodMenu(false), showPeriodMenu)

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
                    setShowCalendar('from')
                  } else {
                    setSelectedPeriod(period)
                  }
                  setShowPeriodMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${period === 'Custom Date' ? 'text-[#B0B0B0] font-semibold' : 'text-[#696969]'
                  }`}
              >
                {period}
              </button>
            ))}
          </div>
        )}

        {/* Date Picker Modal */}
        <Dialog
          open={showDatePicker}
          onOpenChange={(open) => {
            if (!open) {
              setShowDatePicker(false)
              setShowCalendar(null)
            }
          }}
        >
          <DialogContent
            className="w-auto max-w-none border-none p-0 shadow-none bg-transparent"
            showClose={false}
          >
            <DialogTitle className="sr-only">Select Custom Date Range</DialogTitle>
            <div
              className="bg-white rounded-lg shadow-xl relative z-[10000]"
              style={{ width: '320px', padding: '24px' }}
            >
              <div className="flex flex-col" style={{ gap: '20px' }}>
                <div className="flex" style={{ gap: '20px' }}>
                  <div className="flex-1">
                    <label
                      className="block text-[#2E2E2E] font-semibold mb-2 cursor-pointer"
                      style={{
                        fontFamily: 'Public Sans',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '100%'
                      }}
                      onClick={() => openCalendar('from')}
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
                      onClick={() => openCalendar('from')}
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
                      onClick={() => openCalendar('to')}
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
                      onClick={() => openCalendar('to')}
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

                {showCalendar && (
                  <div className="rounded-xl border border-gray-200 p-2">
                    <Calendar
                      mode="single"
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={selectedCalendarDate}
                      onSelect={(date) => date && handleDateSelect(date)}
                      className="rounded-xl bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid  grid-cols-5 px-8 max-lg:hidden">
        <div >
          <div className="text-[32px]  font-extrabold text-[#292929] leading-none">{stats.totalArticles}</div>
          <div className="text-xs font-semibold bg-[linear-gradient(#A941FB,#7864F0_92%)] bg-clip-text text-transparent">Total no. Articles</div>
        </div>
        <div className="ml-8">
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
