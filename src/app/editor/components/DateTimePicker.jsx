"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function DateTimePicker({ isOpen, onClose, onDateTimeSelect, selectedDate, selectedTime }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate.split('-').reverse().join('-')) : null)
  const [time, setTime] = useState(selectedTime || "09:00")

  const pickerRef = useRef(null)

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  // Get today's date for highlighting
  const today = new Date()
  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear
  }

  // Check if a day is selected
  const isSelected = (day) => {
    if (!selectedDay) return false
    return selectedDay.getDate() === day && 
           selectedDay.getMonth() === currentMonth && 
           selectedDay.getFullYear() === currentYear
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Handle date selection
  const handleDateClick = (day) => {
    const newDate = new Date(currentYear, currentMonth, day)
    setSelectedDay(newDate)
  }

  // Handle time change
  const handleTimeChange = (newTime) => {
    setTime(newTime)
  }

  // Handle apply
  const handleApply = () => {
    if (selectedDay) {
      const formattedDate = `${selectedDay.getDate().toString().padStart(2, '0')}-${(selectedDay.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.getFullYear()}`
      onDateTimeSelect(formattedDate, time)
    }
    onClose()
  }

  // Handle clear
  const handleClear = () => {
    setSelectedDay(null)
    setTime("09:00")
    onDateTimeSelect('', '')
    onClose()
  }

  // Handle today
  const handleToday = () => {
    const today = new Date()
    setSelectedDay(today)
    setCurrentDate(today)
    
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
    onDateTimeSelect(formattedDate, time)
    onClose()
  }



  // Generate calendar days
  const generateCalendarDays = () => {
    const days = []

    // Previous month's trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      days.push(
        <button
          key={`prev-${day}`}
          className="w-9 h-9 text-gray-300 text-sm hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => {
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
            const newDate = new Date(prevYear, prevMonth, day)
            setSelectedDay(newDate)
            setCurrentDate(new Date(prevYear, prevMonth, 1))
          }}
        >
          {day}
        </button>
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(day)
      const isSelectedDate = isSelected(day)
      
      days.push(
        <button
          key={day}
          className={`w-9 h-9 text-sm rounded-md transition-colors ${
            isSelectedDate 
              ? 'bg-black text-white' 
              : isTodayDate 
                ? 'bg-gray-100 text-black font-medium' 
                : 'text-gray-900 hover:bg-gray-100'
          }`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </button>
      )
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth)
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <button
          key={`next-${day}`}
          className="w-9 h-9 text-gray-300 text-sm hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => {
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
            const newDate = new Date(nextYear, nextMonth, day)
            setSelectedDay(newDate)
            setCurrentDate(new Date(nextYear, nextMonth, 1))
          }}
        >
          {day}
        </button>
      )
    }

    return days
  }

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={pickerRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Date & Time
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <h4 className="text-base font-medium">
            {months[currentMonth]} {currentYear}
          </h4>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {generateCalendarDays()}
        </div>

        {/* Time Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time (24-hour format)</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <select
              value={time.split(':')[0]}
              onChange={(e) => {
                const newHour = e.target.value
                const currentMinute = time.split(':')[1]
                setTime(`${newHour}:${currentMinute}`)
              }}
              className="flex-1 p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, '0')}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            
            <span className="text-gray-500">:</span>
            
            <select
              value={time.split(':')[1]}
              onChange={(e) => {
                const currentHour = time.split(':')[0]
                const newMinute = e.target.value
                setTime(`${currentHour}:${newMinute}`)
              }}
              className="flex-1 p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, '0')}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Quick time presets */}
          <div className="flex flex-wrap gap-2">
            {['09:00', '12:00', '15:00', '18:00', '21:00'].map((presetTime) => (
              <button
                key={presetTime}
                onClick={() => setTime(presetTime)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  time === presetTime 
                    ? 'bg-black text-white border-black' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {presetTime}
              </button>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
          
          <Button
            onClick={handleApply}
            disabled={!selectedDay}
            className="bg-black text-white hover:bg-gray-800"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}