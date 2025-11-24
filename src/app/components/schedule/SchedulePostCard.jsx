import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Clock,
  MoreVertical
} from "lucide-react"
import Image from "next/image"
import { useRouter } from 'next/navigation'

export default function SchedulePostCard({ 
  post, 
  isSelected, 
  onSelectPost 
}) {
  const router = useRouter()

  const handleEdit = () => {
    router.push(`/editor?status=scheduled&id=${post.id}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 relative">
      {/* Scheduled badge - only for desktop */}
      <div className="absolute -top-0 -left-0 bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded lg:block hidden">
        Scheduled
      </div>

      {/* Desktop Layout - with checkboxes */}
      <div className="hidden lg:block">
        <div className="flex items-start gap-4 mt-2">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectPost(post.id, checked)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {post.excerpt}
            </p>

            
          </div>
          

          {/* Action buttons */}
          <div className="flex gap-1 ml-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-600 h-8 w-8"
            >
              <Image src="/svg/stats.svg" alt="Stats" width={20} height={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-600 h-8 w-8"
              onClick={handleEdit}
            >
              <Image src="/svg/edit.svg" alt="Edit" width={16} height={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-600 h-8 w-8"
            >
              <Image src="/svg/delete.svg" alt="Delete" width={16} height={16} />
            </Button>
          </div>
        </div>
        {/* Tags and timestamp row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap ml-4">
                <Clock className="h-4 w-4" />
                <span>{post.postedTime}</span>
              </div>
            </div>
      </div>

      {/* Tablet Layout - with checkboxes and right-aligned badge/actions */}
      <div className="hidden sm:block lg:hidden">
        <div className="flex items-center gap-4 mt-2">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectPost(post.id, checked)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right-aligned Scheduled badge and action buttons */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded">
              Scheduled
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-gray-600 h-8 w-8"
              >
                <Image src="/svg/stats.svg" alt="Stats" width={16} height={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-gray-600 h-8 w-8"
                onClick={handleEdit}
              >
                <Image src="/svg/edit.svg" alt="Edit" width={16} height={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-gray-600 h-8 w-8"
              >
                <Image src="/svg/delete.svg" alt="Delete" width={16} height={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        {/* Three-dot menu for mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Image src="/svg/stats.svg" alt="Stats" width={16} height={16} />
              <span className="text-base text-gray-700">Statistics</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={handleEdit}>
              <Image src="/svg/edit.svg" alt="Edit" width={16} height={16} />
              <span className="text-base text-gray-700">Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Image src="/svg/delete.svg" alt="Delete" width={16} height={16} />
              <span className="text-base text-gray-700">Move to Trash</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Content */}
        <div className="mt-2 pr-8">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            {post.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="h-4 w-4" />
            <span>{post.postedTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}