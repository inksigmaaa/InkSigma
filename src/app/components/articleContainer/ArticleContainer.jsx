import { useState, useRef } from 'react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'
import { usePublication } from '@/contexts/PublicationContext'
import StatsPopup from './StatsPopup'
import styles from './ArticleContainer.module.css'

export default function ArticleContainer({ id, status, title, description, categories, postedTime, isSelected, onSelect, onDelete, onPublish, onUnpublish, onDraft, publicationId, image, showActions = true, stats }) {
    const router = useRouter()
    const { currentPublication } = usePublication()
    const canPublish = currentPublication?.isOwner || currentPublication?.role === 'admin'
    const [showStats, setShowStats] = useState(false)
    const [statsPosition, setStatsPosition] = useState({ top: 0, left: 0 })
    const statsButtonRef = useRef(null)

    // Check if stats exist and have values
    const hasStats = stats && Array.isArray(stats) && stats.length > 0
    
    console.log('ArticleContainer:', { id, title, stats, hasStats })

    const handleEdit = () => {
        const params = new URLSearchParams({ status, id: id.toString() })
        if (publicationId) {
            params.append('publicationId', publicationId.toString())
        }
        router.push(`/editor?${params.toString()}`)
    }

    const handlePreview = () => {
        router.push(`/home/preview/${id}`)
    }

    const handleStatsClick = (e) => {
        e.stopPropagation()
        console.log('Stats clicked!', { showStats, stats })
        if (!statsButtonRef.current) return
        
        const rect = statsButtonRef.current.getBoundingClientRect()
        console.log('Button rect:', rect)
        setStatsPosition({
            top: rect.bottom + 8,
            left: rect.left
        })
        setShowStats(!showStats)
    }

    const handleDelete = (e) => {
        e?.stopPropagation()
        if (onDelete) onDelete()
    }

    const handlePublish = (e) => {
        e?.stopPropagation()
        if (onPublish) onPublish()
    }

    const handleUnpublish = (e) => {
        e?.stopPropagation()
        if (onUnpublish) onUnpublish()
    }

    const handleDraft = (e) => {
        e?.stopPropagation()
        if (onDraft) onDraft()
    }

    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F42', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' },
        trash: { bg: '#FFD6D6', color: '#A30000', text: 'Trash' },
        review: { bg: '#E9D5FF', color: '#7C3AED', text: 'Review' },
        unpublished: { bg: '#FEF3C7', color: '#D97706', text: 'Unpublished' }
    }

    // Default to draft if status is unknown/missing, rather than published which is misleading
    const config = statusConfig[status] || statusConfig.draft

    return (
        <div className="relative bg-white border border-[#EAEAEA] rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow">
            <div
                className="absolute top-0 left-0 w-22 h-[26px] py-1 px-4 rounded-tl-lg rounded-br-lg font-normal text-xs flex items-center justify-center"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mt-5">
                <div className="flex w-[100%] gap-4">
                    <div className="flex gap-3 flex-1">
                        {showActions && (
                            <label className={styles.customCheckboxLabel} onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected || false}
                                    onChange={(e) => {
                                        e.stopPropagation()
                                        onSelect && onSelect(id, e.target.checked)
                                    }}
                                    className={styles.customCheckboxInput}
                                />
                                <span className={styles.customCheckboxBox} onClick={(e) => e.stopPropagation()}>
                                    {isSelected && (
                                        <img src="/images/icons/tick2.svg" alt="checked" className={styles.checkmarkIcon} style={{ marginTop: '-2px' }} />
                                    )}
                                </span>
                            </label>
                        )}

                        <div className="flex-1 cursor-pointer" onClick={handlePreview}>
                            <h3 className="font-semibold text-sm leading-none text-black mb-2 mt-2 hover:text-purple-600 transition-colors">{title}</h3>
                            <p className="font-normal text-sm leading-relaxed text-gray-400 mb-3">{description}</p>
                        </div>
                    </div>

                    {showActions && (
                        <div className="hidden md:flex gap-2 shrink-0">
                            {hasStats && (
                                <button
                                    ref={statsButtonRef}
                                    className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-1 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                                    title="Stats"
                                    onClick={handleStatsClick}
                                >
                                    <img src="/images/icons/stats1.svg" alt="Stats" className="w-5 h-5" />
                                </button>
                            )}
                            
                            {status === 'trash' ? (
                                <>
                                    {/* Restore not strictly supported in Articles view yet, but adding for consistency if enabled */}
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Delete Permanently" onClick={handleDelete}>
                                        <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                    </button>
                                </>
                            ) : status === 'draft' ? (
                                <>
                                    {canPublish && (
                                        <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Publish" onClick={handlePublish}>
                                            <img src="/images/icons/share.svg" alt="publish" className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                        <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={handleDelete}>
                                        <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                    </button>
                                </>
                            ) : status === 'review' ? (
                                <>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Copy" onClick={() => {}}>
                                        <img src="/images/icons/copy.svg" alt="copy" className="w-4 h-4" />
                                    </button>
                                </>
                            ) : status === 'unpublished' ? (
                                <>
                                    {canPublish && (
                                        <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Republish" onClick={handlePublish}>
                                            <img src="/images/icons/publish-ideal.svg" alt="republish" className="w-4 h-4" />
                                        </button>
                                    )}
                                     <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                        <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Move to Draft" onClick={handleDraft}>
                                        <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={handleDelete}>
                                        <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {status === 'published' && canPublish && (
                                        <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Unpublish" onClick={handleUnpublish}>
                                            <img src="/images/icons/unpublished-hover.svg" alt="unpublish" className="w-8 h-8" />
                                        </button>
                                    )}
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Preview" onClick={handlePreview}>
                                        <img src="/images/icons/preview.svg" alt="preview" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                        <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Draft" onClick={handleDraft}>
                                        <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={handleDelete}>
                                        <img src="/images/icons/delete.svg" alt="delete" className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {showActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer md:hidden">
                                    <img src="/images/icons/kebab.svg" alt="menu" className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-40 rounded-lg border border-gray-200 bg-white shadow-lg md:hidden">
                                {status === 'draft' && canPublish && (
                                    <DropdownMenuItem className="gap-2 text-sm" onClick={handlePublish}>
                                        <img src="/images/icons/share.svg" className="w-4 h-4" /> Publish
                                    </DropdownMenuItem>
                                )}
                                {status === 'published' && canPublish && (
                                    <DropdownMenuItem className="gap-2 text-sm" onClick={handleUnpublish}>
                                        <img src="/images/icons/unpublished.svg" className="w-4 h-4" /> Unpublish
                                    </DropdownMenuItem>
                                )}
                                {status === 'unpublished' && canPublish && (
                                    <DropdownMenuItem className="gap-2 text-sm" onClick={handlePublish}>
                                        <img src="/images/icons/publish-ideal.svg" className="w-4 h-4" /> Republish
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="gap-2 text-sm" onClick={handleDraft}>
                                    <img src="/images/icons/clip.svg" className="w-4 h-4" /> Send to draft
                                </DropdownMenuItem>
                                {hasStats && (
                                    <DropdownMenuItem className="gap-2 text-sm" onClick={handleStatsClick}>
                                        <img src="/images/icons/statistics.svg" className="w-4 h-4" />
                                        Statistics
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="gap-2 text-sm" onClick={handleEdit}>
                                    <img src="/images/icons/edit.svg" className="w-4 h-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-sm text-red-500" onClick={handleDelete}>
                                    <img src="/images/icons/trash3.svg" className="w-4 h-4" /> Move to Trash
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 mt-3">
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat, index) => (
                        <span key={index} className="h-[26px] px-3 py-1 bg-gray-100 rounded text-xs text-gray-500 flex items-center">
                            {cat}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                        <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{postedTime}</span>
                </div>
            </div>

            <StatsPopup
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                position={statsPosition}
                stats={stats}
            />
        </div>
    )
}
