import { useState, useRef } from 'react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'
import StatsPopup from './StatsPopup'

export default function ArticleContainer({ id, status, title, description, categories, postedTime, isSelected, onSelect }) {
    const router = useRouter()
    const [showStats, setShowStats] = useState(false)
    const [statsPosition, setStatsPosition] = useState({ top: 0, left: 0 })
    const statsButtonRef = useRef(null)

    const handleEdit = () => {
        router.push(`/editor?status=${status}&id=${id}`)
    }

    const handleStatsClick = (e) => {
        e.stopPropagation()
        if (statsButtonRef.current) {
            const rect = statsButtonRef.current.getBoundingClientRect()
            setStatsPosition({
                top: rect.top - 68,
                left: rect.right
            })
        }
        setShowStats(!showStats)
    }
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F24', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' },
    }

    const config = statusConfig[status] || statusConfig.published

    return (
        <div className="relative bg-white border border-gray-200 rounded-lg p-4 mb-4">

            {/* status badge */}
            <div
                className="absolute top-0 left-0 w-22 h-[26px] py-1 px-4 rounded-tl-lg rounded-br-lg font-normal text-xs flex items-center justify-center"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            {/* content */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mt-5">
                <div className="flex w-[100%]">

                    {/* left side */}
                    <div className="flex gap-3 flex-1">
                        <input 
                            type="checkbox" 
                            checked={isSelected || false}
                            onChange={(e) => onSelect && onSelect(id, e.target.checked)}
                            className="mt-1 cursor-pointer accent-violet-500 shrink-0"
                            style={{ width: '16px', height: '16px' }}
                        />

                        <div className="flex-1">
                            <h3 className="font-semibold text-sm leading-none text-black mb-2 mt-2">{title}</h3>
                            <p className="font-normal text-sm leading-relaxed text-gray-400 mb-3">{description}</p>
                        </div>
                    </div>

                    {/* desktop actions */}
                    <div className="hidden md:flex gap-2 shrink-0">
                        <button
                            ref={statsButtonRef}
                            className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-1 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            title="Stats"
                            onClick={handleStatsClick}
                        >
                            <img src="/images/icons/stats1.svg" alt="Stats" className="w-5 h-5" />
                        </button>
                        {[
                            { icon: "/images/icons/share.svg", label: "Edit", onClick: handleEdit },
                            { icon: "/images/icons/copy.svg", label: "Copy", onClick: null },
                            { icon: "/images/icons/trash2.svg", label: "Delete", onClick: null },
                        ].map((btn, index) => (
                            <button
                                key={index}
                                className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                                title={btn.label}
                                onClick={btn.onClick}
                            >
                                <img src={btn.icon} alt={btn.label} className="w-5 h-5" />
                            </button>
                        ))}
                    </div>

                    {/* mobile kebab menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer md:hidden">
                                <img src="/images/icons/kebab.svg" alt="menu" className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40 rounded-lg border border-gray-200 bg-white shadow-lg md:hidden">
                            <DropdownMenuItem className="gap-2 text-sm">
                                <img src="/images/icons/clip.svg" className="w-4 h-4" /> Send to draft
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={handleStatsClick}>
                                <img src="/images/icons/statistics.svg" className="w-4 h-4" /> 
                                Statistics
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={handleEdit}>
                                <img src="/images/icons/edit.svg" className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm text-red-500">
                                <img src="/images/icons/trash3.svg" className="w-4 h-4" /> Move to Trash
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* footer */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-3">

                {/* categories */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat, index) => (
                        <span key={index} className="h-[26px] px-3 py-1 bg-gray-100 rounded text-xs text-gray-500 flex items-center">
                            {cat}
                        </span>
                    ))}
                </div>

                {/* posted time */}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                        <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{postedTime}</span>
                </div>
            </div>

            {/* Stats Popup */}
            <StatsPopup 
                isOpen={showStats} 
                onClose={() => setShowStats(false)} 
                position={statsPosition}
            />
        </div>
    )
}