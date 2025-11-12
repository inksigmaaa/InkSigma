import ArticleDropdown from '../articleDropdown/ArticleDropdown.jsx'

export default function PersonalArticleContainer({ id, status, title, description, categories, postedTime, onRestore, onDelete, isSelected, onSelect }) {
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F24', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' },
        trash: { bg: '#FEE2E2', color: '#DC2626', text: 'Trash' },
        review: { bg: '#E9D5FF', color: '#7C3AED', text: 'Review' },
        unpublished: { bg: '#FEF3C7', color: '#D97706', text: 'Unpublished' }
    }

    const config = statusConfig[status] || statusConfig.published

    return (
        <div className="relative bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow max-md:pt-10 max-md:p-4">
            <div 
                className="absolute top-0 left-0 w-22 h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center max-md:flex max-md:min-w-[88px] max-md:w-auto" 
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="absolute top-2 right-2 hidden max-md:block">
                <ArticleDropdown
                    status={status}
                    onEdit={() => console.log('Edit')}
                    onDelete={onDelete}
                    onRestore={onRestore}
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
                <div className="flex gap-2 shrink-0">
                    {status === 'trash' ? (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Restore" onClick={onRestore}>
                                <img src="/images/icons/restore.svg" alt="restore" className="w-6 h-6" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete Permanently" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className="w-6 h-6" />
                            </button>
                        </>
                    ) : status === 'draft' ? (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className="w-6 h-6" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className="w-6 h-6" />
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className="w-6 h-6" />
                            </button>
                            <button className="w-8 h-8 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out" title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-start gap-4 mt-6 max-md:flex-col max-md:mt-0">
                <div className="flex gap-4 flex-1 max-md:w-full max-md:gap-3">
                    <input
                        type="checkbox"
                        className="w-5 h-5 mt-0.5 cursor-pointer accent-purple-500 shrink-0 max-md:hidden"
                        checked={isSelected || false}
                        onChange={(e) => onSelect && onSelect(id, e.target.checked)}
                    />
                    <div className="flex-1 min-w-0 max-md:w-full">
                        <h3 className="font-['Public_Sans'] font-semibold text-base leading-[140%] text-black m-0 mb-2 max-md:text-sm">{title}</h3>
                        <p className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4] m-0 mb-4 max-md:mb-3">{description}</p>
                        <div className="flex justify-start items-center gap-4 flex-wrap max-md:flex-col max-md:items-start max-md:gap-2">
                            <div className="flex gap-2 flex-wrap shrink-0 items-center">
                                {categories.map((cat, index) => (
                                    <span key={index} className="h-7 px-3 py-1 bg-[#F4F4F4] rounded-md font-['Public_Sans'] font-normal text-xs leading-[150%] text-gray-600 inline-flex items-center">{cat}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 max-md:ml-0">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                                    <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4] whitespace-nowrap">{postedTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0 self-start max-md:w-full max-md:justify-end max-md:hidden">
                    {status === 'trash' ? (
                        <>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Restore" onClick={onRestore}>
                                <img src="/images/icons/restore.svg" alt="restore" className="w-5 h-5" />
                            </button>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete Permanently" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className="w-5 h-5" />
                            </button>
                        </>
                    ) : status === 'draft' ? (
                        <>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className="w-5 h-5" />
                            </button>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-300" title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className="w-5 h-5" />
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className="w-5 h-5" />
                            </button>
                            <button className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300" title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
