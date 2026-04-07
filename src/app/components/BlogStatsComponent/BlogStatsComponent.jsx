"use client"

import { useState } from 'react'

const BlogStatsComponent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCalendar, setShowCalendar] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const today = new Date()
  const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom Date']
  const stats = {
    totalArticles: 234,
    views: 12,
    comments: 23,
    shares: 123
  }

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
      setFromDate(formatted)
    } else if (showCalendar === 'to') {
      setToDate(formatted)
    }
    setShowCalendar(null)
  }

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1))
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="w-full">
      {/* Period Selector */}
      <div className="mb-8 relative -mt-10 max-lg:hidden">
        <button
          onClick={() => setShowPeriodMenu(!showPeriodMenu)}
          className="flex items-center gap-2 text-gray-900 font-medium text-sm bg-white px-3 py-1.5 rounded hover:bg-gray-50 transition-colors border border-gray-200"
        >
          {selectedPeriod}
          <span className="text-xs">▼</span>
        </button>

        {showPeriodMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border py-2 z-10 w-48">
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
                  period === 'Custom Date' ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && !showCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-xl w-96">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label 
                    className="block text-gray-700 font-semibold mb-2 cursor-pointer text-lg"
                    onClick={() => setShowCalendar('from')}
                  >
                    From
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={fromDate}
                    readOnly
                    className="w-full px-3 py-3 border-b-2 border-gray-300 text-gray-400 outline-none cursor-pointer"
                    onClick={() => setShowCalendar('from')}
                  />
                </div>
                <div>
                  <label 
                    className="block text-gray-700 font-semibold mb-2 cursor-pointer text-lg"
                    onClick={() => setShowCalendar('to')}
                  >
                    To
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={toDate}
                    readOnly
                    className="w-full px-3 py-3 border-b-2 border-gray-300 text-gray-400 outline-none cursor-pointer"
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
                className="w-full px-8 py-3 bg-purple-100 text-purple-600 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-auto">
              <div className="border-4 border-blue-400 rounded-lg p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                  >
                    «
                  </button>
                  <div className="text-gray-500 font-semibold text-lg">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </div>
                  <button
                    onClick={() => changeMonth(1)}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                  >
                    »
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-gray-400 font-bold text-sm py-2 w-10">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
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
                        className={`w-10 h-10 text-center text-sm rounded flex items-center justify-center
                          ${dayObj.isCurrentMonth 
                            ? isToday 
                              ? 'bg-gray-600 text-white font-bold' 
                              : 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300'
                          }`}
                      >
                        {dayObj.day}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 px-8 max-lg:hidden">
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalArticles}</div>
          <div className="text-xs text-purple-500">Total no. Articles</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.views}</div>
          <div className="text-xs text-purple-500">Views</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.comments}</div>
          <div className="text-xs text-purple-500">Comments</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.shares}</div>
          <div className="text-xs text-purple-500">Shares</div>
        </div>
      </div>
    </div>
  )
}

export default BlogStatsComponent
