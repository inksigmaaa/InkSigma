import Link from 'next/link'
import styles from './Sidebar.module.css'

export default function DashboardSimpleSidebar() {
    return (
        <>
            <div className={styles.sideContainer}>
                <div className={styles.sidebarContainer} style={{ borderBottom: 'none' }}>
                    <div className={styles.mySpace} style={{ borderBottom: 'none' }}>
                        <div className={styles.spaceIcon}>
                            <img src="/images/icons/myspace.svg" alt="my space logo" className={styles.sideLogo} />
                            <Link href="/dashboard"><p className={styles.spaceButton}>My Space</p></Link>
                        </div>
                    </div>
                    <div className={styles.settings} style={{ borderTop: 'none', borderBottom: 'none' }}>
                        <div className={styles.pubIcon}>
                            <img src="/icons/settings.svg" alt="settingsicon" className={styles.sideLogo} />
                            <Link href="/profile-settings"><p className={styles.pubText}>Settings</p></Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
