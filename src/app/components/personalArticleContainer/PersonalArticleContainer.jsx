import ArticleDropdown from '../articleDropdown/ArticleDropdown.jsx'
import { useRouter } from 'next/navigation'
import { usePublication } from '@/contexts/PublicationContext'
import React from 'react'

// Helper function to format relative time
const getRelativeTime = (dateString, status) => {
    if (!dateString) return ''

    try {
        const postDate = new Date(dateString)

        // Check if date is valid
        if (isNaN(postDate.getTime())) {
            return dateString // Return original string if invalid
        }

        // For review status, show full date format
        if (status === 'review') {
            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
            return `Sent on ${postDate.toLocaleDateString('en-US', options)}`
        }

        const now = new Date()
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

export default function PersonalArticleContainer({ id, status, title, description, categories, postedTime, createdAt, onRestore, onDelete, onDraft, onUnpublish, onRepublish, onPublish, isSelected, onSelect, titleColor }) {
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
    const handleTouchStart = () => {
        // Only on mobile - check will be done via CSS media query
        const timer = setTimeout(() => {
            onSelect && onSelect(id, !isSelected)
        }, 500) // 0.5 seconds
        setLongPressTimer(timer)
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
        review: { bg: '#F3EEFF', color: '#3400A3', text: 'Under Review' },
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
            className={`relative rounded-[8px] mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200 min-[768px]:bg-white max-[767px]:bg-[#FEFEFE] w-full max-[640px]:p-4 max-[640px]:pt-10 min-[641px]:p-6 min-[641px]:pt-10 border min-[641px]:border-[#EDEDED] ${isSelected ? 'max-[640px]:border-[#202020]' : 'max-[640px]:border-[#EDEDED]'}`}
            style={{
                overflow: 'hidden'
            }}
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div
                className="absolute top-0 left-0 w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center max-[640px]:flex max-[640px]:min-w-[88px] max-[640px]:w-auto min-[641px]:max-[767px]:hidden min-[768px]:flex min-[768px]:min-w-[88px] min-[768px]:w-auto"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            {/* Mobile only (0-640px): Dropdown or Checkbox */}
            <div className="absolute right-2 max-[640px]:flex max-[640px]:items-center max-[640px]:justify-center max-[640px]:right-4 max-[640px]:top-[15px] min-[641px]:hidden" style={{ width: '26px', height: '26px' }}>
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

            {/* content */}
            <div className="flex flex-col max-[640px]:gap-[24px] min-[641px]:max-[767px]:gap-[14px] min-[768px]:flex-row min-[768px]:justify-between min-[768px]:items-start min-[768px]:gap-[93px] w-full" style={{ maxWidth: '100%' }}>
                {/* Main content row */}
                <div className="flex min-[641px]:max-[767px]:flex-row min-[768px]:flex-row max-[640px]:flex-col min-[641px]:max-[767px]:justify-between min-[641px]:max-[767px]:items-center min-[641px]:max-[767px]:w-full min-[641px]:max-[767px]:gap-[30px] min-[768px]:flex-1 overflow-hidden">
                    {/* Left side: Checkbox + G1 (title, description, categories) */}
                    <div className="flex max-[640px]:gap-0 min-[641px]:gap-3 flex-1 max-[640px]:w-full min-[641px]:max-[767px]:min-w-0 overflow-hidden">
                        {/* Checkbox - Tablet and Desktop (641px+) */}
                        <label className="hidden min-[641px]:flex items-start cursor-pointer mt-1">
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
                        <div className="min-[641px]:flex-1 flex flex-col min-[768px]:max-w-[371px] max-[640px]:w-full min-[641px]:max-[767px]:min-w-0 overflow-hidden max-[640px]:gap-3 min-[641px]:gap-5">
                            <div className="w-full overflow-hidden">
                                <h3
                                    className="font-['Public_Sans'] text-black mb-2 min-[768px]:text-[14px] min-[768px]:leading-[100%] min-[641px]:max-[767px]:text-[14px] min-[641px]:max-[767px]:leading-[100%] max-[640px]:text-[12px] max-[640px]:leading-[150%] break-words"
                                    style={{ fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                >
                                    {title}
                                </h3>
                                <p
                                    className="font-['Public_Sans'] text-[#A4A4A4] line-clamp-2 min-[768px]:text-[14px] min-[768px]:leading-[150%] min-[641px]:max-[767px]:text-[14px] min-[641px]:max-[767px]:leading-[150%] max-[640px]:text-[12px] max-[640px]:leading-[150%] break-words"
                                    style={{ fontWeight: 400, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                >
                                    {description}
                                </p>
                            </div>

                            {/* Categories - All screen sizes */}
                            {categories && categories.length > 0 && (
                                <>
                                    {/* Desktop: Scrollable categories (changed from wrap) */}
                                    <div
                                        className="hidden min-[768px]:flex scrollbar-hide"
                                        style={{
                                            gap: '10px',
                                            maxWidth: '371px',
                                            overflowX: 'auto',
                                            overflowY: 'hidden'
                                        }}
                                    >
                                        {categories.map((cat, index) => (
                                            <span
                                                key={index}
                                                className="bg-[#F8F8F8] flex items-center h-[26px] text-[12px] text-[#808080] whitespace-nowrap flex-shrink-0"
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
                                    {/* Tablet: Scroll categories */}
                                    <div
                                        className="hidden min-[641px]:max-[767px]:flex scrollbar-hide"
                                        style={{
                                            gap: '10px',
                                            maxWidth: '100%',
                                            overflowX: 'auto',
                                            overflowY: 'hidden'
                                        }}
                                    >
                                        {categories.map((cat, index) => (
                                            <span
                                                key={index}
                                                className="bg-[#F8F8F8] flex items-center h-[26px] text-[12px] text-[#808080] whitespace-nowrap flex-shrink-0"
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
                                </>
                            )}

                            {/* Categories - Mobile (0-640px) only */}
                            {categories && categories.length > 0 && (
                                <div
                                    className="flex scrollbar-hide max-[640px]:w-full min-[641px]:hidden"
                                    style={{
                                        gap: '4px',
                                        height: '23px',
                                        overflowX: 'auto',
                                        overflowY: 'hidden'
                                    }}
                                >
                                    {categories.map((cat, index) => (
                                        <span
                                            key={index}
                                            className="bg-[#F8F8F8] flex items-center h-[23px] text-[10px] text-[#808080] whitespace-nowrap flex-shrink-0"
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

                    {/* Middle: Status Badge - Tablet only (641-767px) */}
                    <div className="hidden min-[641px]:max-[767px]:flex min-[641px]:max-[767px]:items-start min-[641px]:max-[767px]:justify-center min-[641px]:max-[767px]:flex-shrink-0">
                        <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                                minWidth: '120px',
                                width: 'auto',
                                height: '26px',
                                borderRadius: '30px',
                                border: '1px solid #EAEAEA',
                                paddingTop: '4px',
                                paddingRight: '16px',
                                paddingBottom: '4px',
                                paddingLeft: '16px',
                                gap: '8px',
                                background: '#FFFFFF',
                                opacity: 1,
                                marginTop: '3px'
                            }}
                        >
                            <span
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: titleColor || config.color,
                                    flexShrink: 0
                                }}
                            />
                            <span style={{
                                fontFamily: 'Public Sans',
                                fontWeight: 400,
                                fontSize: '12px',
                                lineHeight: '150%',
                                letterSpacing: '0%',
                                color: '#808080',
                                whiteSpace: 'nowrap'
                            }}>{config.text}</span>
                        </div>
                    </div>

                    {/* Right side: G2 (action icons + posted time) - Tablet and Desktop (641px+) */}
                    <div className="hidden min-[641px]:flex min-[641px]:flex-col min-[641px]:items-end min-[641px]:flex-shrink-0" style={{ gap: '54px' }}>
                        {/* Action icons */}
                        <div className="flex gap-[10px] flex-shrink-0">
                            {status === 'trash' ? (
                                <>
                                    <button
                                        className="bg-[#FEFEFE] border border-[#EAEAEA] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300"
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', padding: '8px', borderWidth: '1px' }}
                                        title="Edit"
                                        onClick={handleEdit}
                                    >
                                        <img src="/images/icons/edit.svg" alt="edit" />
                                    </button>
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
                            <div className="flex items-center gap-2 text-[#A4A4A4] text-[14px]" style={{ lineHeight: '150%' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                                    <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="font-['Public_Sans']" style={{ fontWeight: 400 }}>
                                    {createdAt ? getRelativeTime(createdAt, status) : postedTime}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile: Posted time at bottom (0-640px only) */}
                {(createdAt || postedTime) && (
                    <div className="min-[641px]:hidden flex items-center gap-1 text-[#A4A4A4]" style={{ fontSize: '10px', lineHeight: '150%', fontFamily: 'Public Sans', fontWeight: 400 }}>
                        <img src="/images/icons/clock.svg" alt="clock" width="9" height="9" />
                        <span>
                            {createdAt ? getRelativeTime(createdAt, status) : postedTime}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
