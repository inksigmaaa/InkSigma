import ArticleDropdown from '../articleDropdown/ArticleDropdown.jsx'
import { useRouter } from 'next/navigation'
import { usePublication } from '@/contexts/PublicationContext'

export default function PersonalArticleContainer({ id, status, title, description, categories, postedTime, onRestore, onDelete, onDraft, onUnpublish, onRepublish, onPublish, isSelected, onSelect }) {
    const router = useRouter()
    const { currentPublication } = usePublication()
    // Explicitly ensure 'author' and 'editor' cannot publish, even if isOwner is somehow true (edge case)
    const canPublish = (currentPublication?.isOwner || currentPublication?.role === 'admin') && currentPublication?.role !== 'author' && currentPublication?.role !== 'editor'

    const handleEdit = () => {
        const publicationQuery = currentPublication?.id ? `&publicationId=${currentPublication.id}` : ''
        router.push(`/editor?status=${status}&id=${id}${publicationQuery}`)
    }
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F42', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' },
        trash: { bg: '#FEE2E2', color: '#DC2626', text: 'Trash' },
        review: { bg: '#E9D5FF', color: '#7C3AED', text: 'Review' },
        unpublished: { bg: '#FEF3C7', color: '#D97706', text: 'Unpublished' }
    }

    const config = statusConfig[status] || statusConfig.published

    const handleCardClick = (e) => {
        // Don't navigate if clicking on buttons, checkboxes, or other interactive elements
        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
            return
        }
        handleEdit()
    }

    return (
        <div
            className="relative bg-white border border-gray-200 rounded-lg p-4 mb-4 max-md:pt-10 max-md:p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={handleCardClick}
        >
            <div
                className="absolute top-0 left-0 w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center max-md:flex max-md:min-w-[88px] max-md:w-auto"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="absolute top-2 right-2 hidden max-md:block">
                <ArticleDropdown
                    status={status}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    canPublish={canPublish}
                />
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
                                    <img src="/images/icons/publish.svg" alt="republish" className="w-4 h-4" />
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
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mt-5">
                <div className="flex w-full">
                    {/* left side */}
                    <div className="flex gap-3 flex-1">
                        <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            marginTop: '4px'
                        }} className="max-md:hidden">
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

                        <div className="flex-1">
                            <h3 className="font-['Public_Sans'] font-semibold text-sm leading-none text-black mb-2 mt-2 max-md:text-sm">{title}</h3>
                            <p className="font-['Public_Sans'] font-normal text-sm leading-relaxed text-[#A4A4A4] mb-3">{description}</p>
                        </div>
                    </div>

                    {/* desktop actions */}
                    <div className="hidden md:flex gap-[10px] shrink-0">
                        {status === 'trash' ? (
                            <>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Restore" onClick={onRestore}>
                                    <img src="/images/icons/restore.svg" alt="restore" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete Permanently" onClick={onDelete}>
                                    <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                </button>
                            </>
                        ) : status === 'draft' ? (
                            <>
                                {canPublish && (
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Publish" onClick={onPublish}>
                                        <img src="/images/icons/share.svg" alt="publish" className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                    <img src="/images/icons/edit.svg" alt="edit" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={onDelete}>
                                    <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                </button>
                            </>
                        ) : status === 'review' ? (
                            <>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Copy">
                                    <img src="/images/icons/copy.svg" alt="copy" className="w-4 h-4" />
                                </button>
                            </>
                        ) : status === 'unpublished' ? (
                            <>
                                {canPublish && (
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Republish" onClick={onRepublish}>
                                        <img src="/images/icons/publish.svg" alt="republish" className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                    <img src="/images/icons/edit-ideal.svg" alt="edit" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Move to Draft" onClick={onDraft}>
                                    <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={onDelete}>
                                    <img src="/images/icons/trash2.svg" alt="delete" className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                {status === 'published' && canPublish && (
                                    <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Unpublish" onClick={onUnpublish}>
                                        <img src="/images/icons/unpublished-hover.svg" alt="unpublish" className="w-8 h-8" />
                                    </button>
                                )}
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Preview">
                                    <img src="/images/icons/preview.svg" alt="preview" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit" onClick={handleEdit}>
                                    <img src="/images/icons/edit-ideal.svg" alt="edit" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Draft" onClick={onDraft}>
                                    <img src="/images/icons/copy.svg" alt="draft" className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={onDelete}>
                                    <img src="/images/icons/delete.svg" alt="delete" className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* footer */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-3">
                {/* categories */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat, index) => (
                        <span key={index} className="h-[26px] px-3 py-1 bg-[#F4F4F4] rounded text-xs text-gray-500 flex items-center">{cat}</span>
                    ))}
                </div>

                {/* posted time */}
                {postedTime && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                            <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>{postedTime}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
