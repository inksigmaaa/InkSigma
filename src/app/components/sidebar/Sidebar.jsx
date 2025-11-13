"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function Sidebar() {
    const pathname = usePathname()
    return (
        <>
            <div className={styles.sideContainer}>
                <div className={styles.sidebarContainer}>
                    <div className={styles.profile}>
                        <img src="/images/icons/profileuser.svg" alt="profileImg" className={styles.profileImg} />
                        <Link href="/"><button className={styles.viewtext}>View Site</button></Link>
                    </div>
                    <div className={styles.mySpace}>
                        <div className={styles.spaceIcon}>
                            <img src="/images/icons/myspace.svg" alt="my space logo" className={styles.sideLogo} />
                            <Link href="/dashboard"><p className={styles.spaceButton}>My Space</p></Link>
                        </div>
                    </div>
                    <div className={styles.publicationContainer}>
                        <h1 className={styles.publicationHeading}>PUBLICATION</h1>
                        <div className={styles.home}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/home.svg" alt="homeicon" className={styles.sideLogo} />
                                <Link href="/posts"><p className={styles.pubText}>Home</p></Link>
                            </div>
                        </div>
                        <div className={styles.member}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Member.svg" alt="membericon" className={styles.sideLogo} />
                                <Link href="/posts/members"><p className={styles.pubText}>Members</p></Link>
                            </div>
                        </div>
                    </div>
                    <div className={styles.articleContainer}>
                        <h1 className={styles.publicationHeading}>ARTICLES</h1>
                        <div className={styles.home}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Publish.svg" alt="publishicon" className={styles.sideLogo} />
                                <Link href="/posts"><p className={styles.pubText}>Published</p></Link>
                            </div>
                        </div>
                        <div className={styles.settings}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Review.svg" alt="reviewicon" className={styles.sideLogo} />
                                <Link href="/review"><p className={styles.pubText}>Review</p></Link>
                            </div>
                        </div>
                    </div>
                    <div className={styles.articleContainer}>
                        <h1 className={styles.publicationHeading}>PERSONAL</h1>
                        <div className={styles.home}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/all_articles.svg" alt="myblogsicon" className={styles.sideLogo} />
                                <Link href="/my-blogs"><p className={styles.pubText}>My Blogs</p></Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </>
    )
}
