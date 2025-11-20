import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const inputRef = React.useRef(null)
  
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked)
    }
  }

  const handleDivClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        checked={checked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        onClick={handleDivClick}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white cursor-pointer",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "peer-checked:bg-violet-500 peer-checked:border-violet-500",
          "flex items-center justify-center",
          className
        )}
      >
        {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
      </div>
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
