"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export function DateTimePicker({ isOpen, onClose, onDateTimeSelect, selectedDate, selectedTime }) {
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate.split('-').reverse().join('-')) : null)
  const [time, setTime] = useState(selectedTime || "09:00")

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
    setCalendarMonth(today)
    
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
    onDateTimeSelect(formattedDate, time)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md p-6" showClose={false}>
        <DialogTitle className="sr-only">Select Date and Time</DialogTitle>
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

        <div className="mb-6">
          <Calendar
            mode="single"
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            selected={selectedDay || undefined}
            onSelect={(date) => date && setSelectedDay(date)}
            className="rounded-md border border-gray-200 p-3"
          />
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
      </DialogContent>
    </Dialog>
  )
}
