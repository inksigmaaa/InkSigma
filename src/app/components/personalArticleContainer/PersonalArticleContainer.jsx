import styles from './PersonalArticleContainer.module.css'
import ArticleDropdown from '../articleDropdown/ArticleDropdown'

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
        <div className={styles.articleCard}>
            <div className={styles.statusBadge} style={{ background: config.bg, color: config.color }}>
                {config.text}
            </div>

            <div className={styles.mobileDropdown}>
                <ArticleDropdown 
                    status={status}
                    onEdit={() => console.log('Edit')}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            </div>

            {/* Tablet Status and Actions Row */}
            <div className={styles.tabletStatusActions}>
                <div className={styles.statusBadge} style={{ background: config.bg, color: config.color }}>
                    {config.text}
                </div>
                <div className={styles.actions}>
                    {status === 'trash' ? (
                        <>
                            <button className={styles.actionButton} title="Restore" onClick={onRestore}>
                                <img src="/images/icons/restore.svg" alt="restore" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Delete Permanently" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : status === 'draft' ? (
                        <>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button className={styles.actionButton} title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.leftSection}>
                    <input 
                        type="checkbox" 
                        className={styles.checkbox}
                        checked={isSelected || false}
                        onChange={(e) => onSelect && onSelect(id, e.target.checked)}
                    />
                    <div className={styles.textContent}>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>
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
                    </div>
                </div>

                <div className={styles.actions}>
                    {status === 'trash' ? (
                        <>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Restore" onClick={onRestore}>
                                <img src="/images/icons/restore.svg" alt="restore" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Delete Permanently" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : status === 'draft' ? (
                        <>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Delete" onClick={onDelete}>
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button className={styles.actionButton} title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.actionButton} title="Edit">
                                <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                            </button>
                            <button className={styles.actionButton} title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
