"use client"
import styles from './Comments.module.css'
import { useState } from 'react'

export default function Comments() {
    const [selectAll, setSelectAll] = useState(false)

    const model = {
        count: 23,
    }

    return (
        <div className={styles.commentsContainer}>
            <div className={styles.commentsContent}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>Comments({model.count})</h1>
                    </div>
                    <div className={styles.controlsRow}>
                        <div className={styles.topSection}>
                            <label className={styles.selectAllLabel}>
                                <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} className={styles.checkbox} />
                                <span className={styles.selectAllText}>Select all</span>
                            </label>
                            <button className={styles.iconButton} title="Delete">
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.icon} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className={styles.commentContainer}>
                    <div className={styles.mainContainer}>
                        <input type="checkbox" />
                        <div className={styles.userComment}>
                            <div className={styles.line1}>
                                <div className={styles.userTitle}>
                                    <img src="/images/comment/commentuser1.svg" alt="commentuser" className={styles.commentUser} />
                                    <p className={styles.commentUsername}>Sammy</p>
                                </div>
                                <p className={styles.postedTime}>2 days ago</p>
                            </div>
                            <div className={styles.commentDescription}>
                                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ullam iste at repellendus dolore sequi libero omnis non placeat adipisci vitae reiciendis tenetur sint nam, laboriosam consequuntur similique ratione doloribus animi.
                            </div>
                            <hr className={styles.commentBreak} />
                            <div className={styles.commentFooter}>
                                <p className={styles.commentArticle}>Article: The title of the article</p>
                                <p className={styles.commentConvo}>
                                    <a href="#" className={styles.seeConvo}>
                                        See Full Conversation

                                    </a>
                                    <span>
                                        <img src="/images/comment/chevronright.svg" alt="chevron-right" />
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}