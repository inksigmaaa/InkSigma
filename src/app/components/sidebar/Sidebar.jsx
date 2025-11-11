import Link from 'next/link'
import styles from './Sidebar.module.css'

export default function Sidebar() {
    return (
        <>
            <div className={styles.sideContainer}>
                <div className={styles.sidebarContainer}>
                    <div className={styles.profile}>
                        <img src="/images/icons/profileuser.svg" alt="profileImg" className={styles.profileImg} />
                        <Link href="/"><button className={styles.viewtext}>view site</button></Link>
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
                                <p className={styles.pubText}>Home</p>
                            </div>
                        </div>
                        <div className={styles.domain}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/domain.svg" alt="domainicon" className={styles.sideLogo} />
                                <p className={styles.pubText}>Domain</p>
                            </div>
                        </div>
                        <div className={styles.member}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Member.svg" alt="membericon" className={styles.sideLogo} />
                                <p className={styles.pubText}>Members</p>
                            </div>
                        </div>
                        <div className={styles.settings}>
                            <div className={styles.pubIcon}>
                                <img src="/icons/settings.svg" alt="settingsicon" className={styles.sideLogo} />
                                <p className={styles.pubText}>Settings</p>
                            </div>
                        </div>

                    </div>
                    <div className={styles.articleContainer}>
                        <h1 className={styles.publicationHeading}>ARTICLES</h1>
                        <div className={styles.home}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/all_articles.svg" alt="allarticlesicon" className={styles.sideLogo} />
                                <p className={styles.pubText}>All Articles</p>
                            </div>
                        </div>
                        <div className={styles.domain}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Publish.svg" alt="publishicon" className={styles.sideLogo} />
                                <p className={styles.pubText}>Published</p>
                            </div>
                        </div>
                        <div className={styles.member}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Schedule.svg" alt="scheduleicon" className={styles.sideLogo} />
                                <Link href="/schedule"><p className={styles.pubText}>Schedule</p></Link>
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
                                <a href="/my-blogs"><p className={styles.pubText}>My Blogs</p></a>
                            </div>
                        </div>
                        <div className={styles.domain}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Publish.svg" alt="drafticon" className={styles.sideLogo} />
                                <a href="/draft"><p className={styles.pubText}>Draft</p></a>
                            </div>
                        </div>
                        <div className={styles.member}>
                            <div className={styles.pubIcon}>
                                <img src="/images/icons/Schedule.svg" alt="trashicon" className={styles.sideLogo} />
                                <a href="/trash"><p className={styles.pubText}>Trash</p></a>
                            </div>
                        </div>


                    </div>

                </div>
            </div>

        </>
    )
}