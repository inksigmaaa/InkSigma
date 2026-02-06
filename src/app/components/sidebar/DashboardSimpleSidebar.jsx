'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function DashboardSimpleSidebar() {
    const pathname = usePathname()

    return (
        <>
            <div className={styles.sideContainer}>
                <div className={styles.sidebarContainer}>
                    <div className={styles.mySpace}>
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <div className={`${styles.spaceIcon} ${pathname === '/' ? styles.active : ''}`}>
                                <img
                                    src="/images/icons/myspace.svg"
                                    alt="my space logo"
                                    className={styles.spaceLogo}
                                />
                                <p className={styles.spaceButton}>
                                    My Space
                                </p>
                            </div>
                        </Link>
                    </div>
                    <div className={`${styles.settings} ${pathname === '/profile-settings' ? styles.active : ''}`}>
                        <Link href="/profile-settings" style={{ textDecoration: 'none', width: '100%' }}>
                            <div className={styles.pubIcon}>
                                <img
                                    src="/icons/settings.svg"
                                    alt="settingsicon"
                                />
                                <p className={styles.pubText}>
                                    Settings
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
