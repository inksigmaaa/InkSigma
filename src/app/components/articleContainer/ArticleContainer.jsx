import styles from './ArticleContainer.module.css'
import {useState} from 'react'

export default function ArticleContainer({ status, title, description, categories, postedTime }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const statusConfig = {
        published: { bg: '#D5F2D4', color: '#267F24', text: 'Published' },
        draft: { bg: '#FFEADB', color: '#A34200', text: 'Draft' },
        scheduled: { bg: '#D6EEFB', color: '#0048B5', text: 'Scheduled' }
    }

    const config = statusConfig[status] || statusConfig.published

    return (
        <div className={styles.articleCard}>
            <div className={styles.statusBadge} style={{ background: config.bg, color: config.color }}>
                {config.text}
            </div>

            <div className={styles.content}>
                <div className={styles.encase}>
                <div className={styles.leftSection}>
                    <input type="checkbox" className={styles.checkbox} />
                    <div className={styles.textContent}>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>

                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.actionButton} title="Stats">
                        <img src="/images/icons/restore.svg" alt="stats" className={styles.actionIcon} />
                    </button>
                    <button className={styles.actionButton} title="Edit">
                        <img src="/images/icons/share.svg" alt="edit" className={styles.actionIcon} />
                    </button>
                    <button className={styles.actionButton} title="Copy">
                        <img src="/images/icons/copy.svg" alt="copy" className={styles.actionIcon} />
                    </button>
                    <button className={styles.actionButton} title="Delete">
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
                            <button className={styles.menuItem}>
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
        </div>
    )
}
