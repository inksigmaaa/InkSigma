import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Trash2,
  TrendingUp,
  Edit,
  Clock,
  MoreVertical
} from "lucide-react"

export default function SchedulePostCard({ 
  post, 
  isSelected, 
  onSelectPost 
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-6 pb-6 pt-10 relative">
      {/* Scheduled badge - positioned absolutely */}
      <div className="absolute top-[-1px] left-[-16px] w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center max-md:flex max-md:min-w-[88px] max-md:w-auto">
        <div className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded">
          Scheduled
        </div>
      </div>

      {/* Three-dot menu for mobile - positioned absolutely */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-gray-400 absolute top-4 right-4">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <span className="text-base text-gray-700">Statics</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <Edit className="h-5 w-5 text-gray-600" />
            <span className="text-base text-gray-700">Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <Trash2 className="h-5 w-5 text-gray-600" />
            <span className="text-base text-gray-700">Move to Trash</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectPost(post.id, e.target.checked)}
            className="w-[18px] h-[18px] cursor-pointer accent-purple-600 mt-1 shrink-0"
          />

          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
              <TrendingUp className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
            <Clock className="h-4 w-4" />
            <span>{post.postedTime}</span>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pr-8">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3 leading-relaxed">
          {post.excerpt}
        </p>

        <div className="flex gap-2 flex-wrap mb-3">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span>{post.postedTime}</span>
        </div>
      </div>
    </div>
  )
}