import styles from './ArticleContainer.module.css'
import { useState } from 'react'

export default function ArticleContainer({ status, title, description, categories, postedTime }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F24', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' }
    }

    const config = statusConfig[status] || statusConfig.published

    return (
        <div className="relative bg-white border border-gray-200 rounded-lg p-4 mb-4 transition-shadow hover:shadow-md">

            <div
                className="absolute top-0 left-0 w-22 h-[26px] py-1 px-4 rounded-tl-lg rounded-br-lg font-normal text-xs flex items-center justify-center"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mt-5">

                <div className="flex">

                    <div className="flex gap-3 flex-1">

                        <input type="checkbox" className="w-5 h-5 mt-1 cursor-pointer accent-violet-500 shrink-0" />

                        <div className="flex-1">

                            <h3 className="font-semibold text-sm leading-none text-black mb-2 mt-2">{title}</h3>
                            <p className="font-normal text-sm leading-relaxed text-gray-400 mb-3">{description}</p>

                        </div>
                    </div>

                    <div className="hidden md:flex gap-2 shrink-0">

                        <button
                            className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            title="Stats"
                        >

                            <img src="/images/icons/restore.svg" alt="stats" className={styles.actionIcon} />
                        </button>
                        <button
                            className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            title="Edit"
                        >

                            <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                        </button>
                        <button
                            className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            title="Copy"
                        >

                            <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                        </button>
                        <button
                            className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            title="Delete"
                            onClick={() => setShowDeletePopup(true)}
                        >

                            <img src="/images/icons/trash1.svg" alt="delete" className={styles.actionIcon} />
                        </button>
                    </div>
                    <div className={styles.mobileMenu}>
                        <button className={styles.kebabButton} onClick={() => setMenuOpen(!menuOpen)}>
                            <img src="/images/icons/kebab.svg" alt="kebabicon" />
                        </button>

                        {menuOpen && (
                            <div className={styles.dropdownMenu}>
                                <button className={styles.menuItem}>
                                    <img src="/images/icons/clip.svg" alt="" /> <p>Send to draft</p>
                                </button>
                                <button className={styles.menuItem}>
                                    <img src="/images/icons/statistics.svg" alt="" /> <p>Statics</p>
                                </button>
                                <button className={styles.menuItem}>
                                    <img src="/images/icons/edit.svg" alt="" /><p>Edit</p>
                                </button>
                                <button className={styles.menuItem} onClick={() => setShowDeletePopup(true)}>
                                    <img src="/images/icons/trash3.svg" alt="" /><p>Move to Trash</p>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            <div className={styles.footer}>
                <div className={styles.categories}>
                    {categories.map((cat, index) => (
                        <span key={index} className={styles.categoryTag}>{cat}</span>
                    ))}
                </div>
                <div className={styles.posted}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                        <path d="M8 4V8L11 10" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className={styles.postedText}>{postedTime}</span>
                </div>
            </div>

            {showDeletePopup && (
                <div className={styles.deleteOverlay} onClick={() => setShowDeletePopup(false)}>
                    <div className={styles.deletePopup} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.deleteTitle}>Are you sure you want to delete?</h2>
                        <p className={styles.deleteDescription}>
                            This will permanently delete this article and cannot be restored
                        </p>
                        <div className={styles.deleteActions}>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowDeletePopup(false)}
                            >
                                Close
                            </button>
                            <button
                                className={styles.deleteButton}
                                onClick={() => {
                                    // Add your delete logic here
                                    console.log('Deleting article...');
                                    setShowDeletePopup(false);
                                }}
                            >
                                Delete permanelty
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}