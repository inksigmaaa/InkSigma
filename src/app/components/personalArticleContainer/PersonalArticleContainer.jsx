import ArticleDropdown from '../articleDropdown/ArticleDropdown.jsx'
import { useRouter } from 'next/navigation'
import { usePublication } from '@/contexts/PublicationContext'
import React from 'react'

// Helper function to format relative time
const getRelativeTime = (dateString) => {
    if (!dateString) return ''
    
    try {
        const now = new Date()
        const postDate = new Date(dateString)
        
        // Check if date is valid
        if (isNaN(postDate.getTime())) {
            return dateString // Return original string if invalid
        }
        
        const diffInSeconds = Math.floor((now - postDate) / 1000)
        const diffInMinutes = Math.floor(diffInSeconds / 60)
        const diffInHours = Math.floor(diffInMinutes / 60)
        const diffInDays = Math.floor(diffInHours / 24)

        // Just now (less than 1 minute)
        if (diffInMinutes < 1) {
            return 'Posted just now'
        }
        
        // Minutes ago (1-59 minutes)
        if (diffInMinutes < 60) {
            return `Posted ${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`
        }
        
        // Hours ago (1-23 hours)
        if (diffInHours < 24) {
            return `Posted ${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`
        }
        
        // Show actual date after 24 hours
        const options = { day: 'numeric', month: 'short', year: 'numeric' }
        return `Posted ${postDate.toLocaleDateString('en-US', options)}`
    } catch (error) {
        return dateString // Return original string if error occurs
    }
}

export default function PersonalArticleContainer({ id, status, title, description, categories, postedTime, createdAt, onRestore, onDelete, onDraft, onUnpublish, onRepublish, onPublish, isSelected, onSelect }) {
    const router = useRouter()
    const { currentPublication } = usePublication()
    const [longPressTimer, setLongPressTimer] = React.useState(null)
    
    // Explicitly ensure 'author' and 'editor' cannot publish, even if isOwner is somehow true (edge case)
    const canPublish = (currentPublication?.isOwner || currentPublication?.role === 'admin') && currentPublication?.role !== 'author' && currentPublication?.role !== 'editor'

    const handleEdit = () => {
        const publicationQuery = currentPublication?.id ? `&publicationId=${currentPublication.id}` : ''
        router.push(`/editor?status=${status}&id=${id}${publicationQuery}`)
    }
    
    // Long press handlers for mobile
    const handleTouchStart = (e) => {
        if (window.innerWidth <= 768) { // Mobile only
            const timer = setTimeout(() => {
                onSelect && onSelect(id, !isSelected)
            }, 500) // 0.5 seconds
            setLongPressTimer(timer)
        }
    }

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer)
            setLongPressTimer(null)
        }
    }
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F42', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' },
        trash: { bg: '#FFD6D6', color: '#A30000', text: 'Trash' },
        review: { bg: '#E9D5FF', color: '#7C3AED', text: 'Review' },
        unpublished: { bg: '#FEF3C7', color: '#D97706', text: 'Unpublished' }
    }

    const config = statusConfig[status] || statusConfig.published

    const handleCardClick = (e) => {
        // Don't navigate if clicking on buttons, checkboxes, or other interactive elements
        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('label')) {
            return
        }
        // Navigate to preview in same tab
        const publicationQuery = currentPublication?.id ? `?publicationId=${currentPublication.id}` : ''
        router.push(`/home/preview/${id}${publicationQuery}`)
    }

    return (
        <div
            className="relative rounded-[8px] mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200 md:bg-white max-md:bg-[#FEFEFE]"
            style={{ 
                paddingTop: '40px', 
                paddingRight: window.innerWidth <= 768 ? '16px' : '24px', 
                paddingBottom: window.innerWidth <= 768 ? '16px' : '24px', 
                paddingLeft: window.innerWidth <= 768 ? '16px' : '24px',
                borderWidth: '1px',
                borderColor: isSelected && window.innerWidth <= 768 ? '#202020' : (window.innerWidth <= 768 ? '#EDEDED' : '#E5E7EB'),
                borderStyle: 'solid'
            }}
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <style jsx>{`
                @media (max-width: 768px) {
                    div {
                        width: 300px;
                        height: 188px;
                        padding-top: 40px;
                        padding-right: 16px;
                        padding-bottom: 16px;
                        padding-left: 16px;
                    }
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div
                className="absolute top-0 left-0 w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center max-md:flex max-md:min-w-[88px] max-md:w-auto"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="absolute right-2 hidden max-md:flex max-md:items-center max-md:justify-center max-md:right-4 max-md:top-[15px]" style={{ width: '26px', height: '26px' }}>
                {isSelected ? (
                    /* Mobile selection checkbox */
                    <div 
                        className="flex items-center justify-center rounded-full"
                        style={{
                            width: '22px',
                            height: '22px',
                            backgroundColor: '#202020'
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            onSelect && onSelect(id, false)
                        }}
                    >
                        <img 
                            src="/images/icons/tick2.svg" 
                            alt="selected" 
                            style={{ 
                                width: '12px', 
                                height: '12px', 
                                filter: 'brightness(0) invert(1)' 
                            }} 
                        />
                    </div>
                ) : (
                    <div style={{ transform: 'scale(0.8125)', transformOrigin: 'center' }}>
                        <ArticleDropdown
                            status={status}
                            onEdit={handleEdit}
                            onDelete={onDelete}
                            onRestore={onRestore}
                            onPublish={onPublish}
                            onUnpublish={onUnpublish}
                            onRepublish={onRepublish}
                            onDraft={onDraft}
                            canPublish={canPublish}
                        />
                    </div>
                )}
            </div>

            {/* Tablet Status and Actions Row */}
            <div className="hidden">
                <div
                    className="absolute top-0 left-0 w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center"
                    style={{ background: config.bg, color: config.color }}
                >
                    {config.text}
                </div>
                <div className="flex gap-[10px] shrink-0">
                    {status === 'trash' ? (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Restore" onClick={onRestore}>
                                <img src="/images/icons/restore.svg" alt="restore" className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete Permanently" onClick={onDelete}>
                                <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                            </button>
                        </>
                    ) : status === 'draft' ? (
                        <>
                            {canPublish && (
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Publish" onClick={onPublish}>
                                    <img src="/images/icons/share.svg" alt="publish" className="w-4 h-4" />
                                </button>
                            )}
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Edit" onClick={handleEdit}>
                                <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className="w-4 h-4" />
                            </button>
                        </>
                    ) : status === 'unpublished' ? (
                        <>
                            {canPublish && (
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Republish" onClick={onRepublish}>
                                    <img src="/images/icons/publish-ideal.svg" alt="republish" className="w-4 h-4" />
                                </button>
                            )}
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Edit" onClick={handleEdit}>
                                <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Move to Draft" onClick={onDraft}>
                                <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            {status === 'published' && canPublish && (
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Unpublish" onClick={onUnpublish}>
                                    <img src="/images/icons/unpublished.svg" alt="unpublish" className="w-4 h-4" />
                                </button>
                            )}
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Preview">
                                <img src="/images/icons/preview.svg" alt="preview" className="w-4 h-4" />
                            </button>
                            {canPublish && (
                                <>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Edit" onClick={handleEdit}>
                                        <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Draft" onClick={onDraft}>
                                        <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete" onClick={onDelete}>
                                        <img src="/images/icons/delete.svg" alt="delete" className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:gap-[93px]" style={{ width: window.innerWidth <= 768 ? '268px' : 'auto', gap: window.innerWidth <= 768 ? '24px' : undefined }}>
                {/* Left side: Checkbox + G1 (title, description, categories) */}
                <div className="flex max-md:gap-0 md:gap-3 flex-1 max-md:w-full">
                    {/* Checkbox - Desktop only */}
                    <label className="hidden md:flex items-start cursor-pointer mt-1">
                        <input
                            type="checkbox"
                            style={{ display: 'none' }}
                            checked={isSelected || false}
                            onChange={(e) => onSelect && onSelect(id, e.target.checked)}
                        />
                        <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: '1px solid #C0C0C0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: (isSelected || false) ? '#000000' : 'transparent',
                            borderColor: (isSelected || false) ? '#000000' : '#C0C0C0',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                        }}>
                            {(isSelected || false) && (
                                <img src="/images/icons/tick2.svg" alt="checked" style={{ width: '10px', height: '10px', filter: 'brightness(0) invert(1)' }} />
                            )}
                        </span>
                    </label>

                    {/* G1: Title, Description, Categories */}
                    <div className="md:flex-1 flex flex-col md:w-[339px] max-md:w-full" style={{ gap: window.innerWidth <= 768 ? '12px' : (categories && categories.length > 0 ? '20px' : '0') }}>
                        <div className="max-md:w-[196px] max-md:max-w-[196px] max-md:overflow-hidden">
                            <h3 className="font-['Public_Sans'] text-black mb-2 md:text-[14px] md:leading-[100%] max-md:text-[12px] max-md:leading-[150%] max-md:break-words max-md:overflow-wrap-anywhere" style={{ fontWeight: 600 }}>{title}</h3>
                            <p className="font-['Public_Sans'] text-[#A4A4A4] line-clamp-2 md:text-[14px] md:leading-[150%] max-md:text-[12px] max-md:leading-[150%] max-md:break-words max-md:overflow-wrap-anywhere" style={{ fontWeight: 400 }}>{description}</p>
                        </div>
                        
                        {/* Categories - only show if there are categories */}
                        {categories && categories.length > 0 && (
                            <div 
                                className="flex md:flex-wrap max-md:overflow-x-auto max-md:overflow-y-hidden scrollbar-hide max-md:w-full" 
                                style={{ 
                                    gap: window.innerWidth <= 768 ? '4px' : '10px',
                                    height: window.innerWidth <= 768 ? '23px' : 'auto'
                                }}
                            >
                                {categories.map((cat, index) => (
                                    <span 
                                        key={index} 
                                        className="bg-[#F4F4F4] flex items-center md:h-[26px] max-md:h-[23px] md:text-[12px] max-md:text-[10px] text-[#808080] max-md:whitespace-nowrap max-md:flex-shrink-0"
                                        style={{
                                            borderRadius: '4px',
                                            paddingTop: '4px',
                                            paddingRight: '12px',
                                            paddingBottom: '4px',
                                            paddingLeft: '12px',
                                            fontFamily: 'Public Sans',
                                            fontWeight: 400,
                                            lineHeight: '150%'
                                        }}
                                    >{cat}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: G2 (action icons + posted time) - Desktop only */}
                <div className="flex flex-col items-end max-md:hidden" style={{ gap: '54px' }}>
                    {/* Action icons */}
                    <div className="hidden md:flex gap-[10px] shrink-0">
                        {status === 'trash' ? (
                            <>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Restore" 
                                    onClick={onRestore}
                                >
                                    <img src="/images/icons/restore.svg" alt="restore" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Delete Permanently" 
                                    onClick={onDelete}
                                >
                                    <img src="/images/icons/trash2.svg" alt="delete" />
                                </button>
                            </>
                        ) : status === 'draft' ? (
                            <>
                                {canPublish && (
                                    <button 
                                        className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                        title="Publish" 
                                        onClick={onPublish}
                                    >
                                        <img src="/images/icons/share.svg" alt="publish" />
                                    </button>
                                )}
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Edit" 
                                    onClick={handleEdit}
                                >
                                    <img src="/images/icons/edit.svg" alt="edit" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Delete" 
                                    onClick={onDelete}
                                >
                                    <img src="/images/icons/trash2.svg" alt="delete" />
                                </button>
                            </>
                        ) : status === 'review' ? (
                            <>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Copy"
                                >
                                    <img src="/images/icons/copy.svg" alt="copy" />
                                </button>
                            </>
                        ) : status === 'unpublished' ? (
                            <>
                                {canPublish && (
                                    <button 
                                        className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                        title="Republish" 
                                        onClick={onRepublish}
                                    >
                                        <img src="/images/icons/publish-ideal.svg" alt="republish" />
                                    </button>
                                )}
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Edit" 
                                    onClick={handleEdit}
                                >
                                    <img src="/images/icons/edit-ideal.svg" alt="edit" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Move to Draft" 
                                    onClick={onDraft}
                                >
                                    <img src="/images/icons/copy.svg" alt="draft" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Delete" 
                                    onClick={onDelete}
                                >
                                    <img src="/images/icons/trash2.svg" alt="delete" />
                                </button>
                            </>
                        ) : (
                            <>
                                {status === 'published' && canPublish && (
                                    <button 
                                        className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                        title="Unpublish" 
                                        onClick={onUnpublish}
                                    >
                                        <img src="/images/icons/unpublished-hover.svg" alt="unpublish" />
                                    </button>
                                )}
                                {/* Stats/Preview button - commented out */}
                                {/* <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Preview"
                                >
                                    <img src="/images/icons/preview.svg" alt="preview" />
                                </button> */}
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Edit" 
                                    onClick={handleEdit}
                                >
                                    <img src="/images/icons/edit-ideal.svg" alt="edit" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Draft" 
                                    onClick={onDraft}
                                >
                                    <img src="/images/icons/copy.svg" alt="draft" />
                                </button>
                                <button 
                                    className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" 
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                    title="Delete" 
                                    onClick={onDelete}
                                >
                                    <img src="/images/icons/delete.svg" alt="delete" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Posted time */}
                    {(createdAt || postedTime) && (
                        <div className="flex items-center gap-2 text-[#A4A4A4] md:text-[14px] max-md:text-[10px] max-md:mt-4" style={{ lineHeight: '150%' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                                <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="font-['Public_Sans']" style={{ fontWeight: 400 }}>
                                {createdAt ? getRelativeTime(createdAt) : postedTime}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Mobile: Posted time at bottom */}
                {(createdAt || postedTime) && (
                    <div className="md:hidden flex items-center gap-1 text-[#A4A4A4]" style={{ fontSize: '10px', lineHeight: '150%', fontFamily: 'Public Sans', fontWeight: 400 }}>
                        <img src="/images/icons/clock.svg" alt="clock" width="9" height="9" />
                        <span>
                            {createdAt ? getRelativeTime(createdAt) : postedTime}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
