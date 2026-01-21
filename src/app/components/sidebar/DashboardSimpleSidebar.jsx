'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function DashboardSimpleSidebar() {
    const pathname = usePathname()

    return (
        <>
            <div className={styles.sideContainer}>
                <div className={styles.sidebarContainer} style={{ borderBottom: 'none' }}>
                    <div className={styles.mySpace} style={{ borderBottom: 'none' }}>
                        <div className={styles.spaceIcon}>
                            <img
                                src="/images/icons/myspace.svg"
                                alt="my space logo"
                                className={styles.sideLogo}
                                style={{ filter: pathname === '/dashboard' ? 'brightness(0)' : 'none' }}
                            />
                            <Link href="/dashboard">
                                <p
                                    className={styles.spaceButton}
                                    style={{
                                        fontWeight: pathname === '/dashboard' ? 'bold' : '400',
                                        color: pathname === '/dashboard' ? '#000' : '#374151'
                                    }}
                                >
                                    My Space
                                </p>
                            </Link>
                        </div>
                    </div>
                    <div className={styles.settings} style={{ borderTop: 'none', borderBottom: 'none' }}>
                        <div className={styles.pubIcon}>
                            <img
                                src="/icons/settings.svg"
                                alt="settingsicon"
                                className={styles.sideLogo}
                                style={{
                                    opacity: pathname === '/profile-settings' ? '1' : '0.6',
                                    filter: pathname === '/profile-settings' ? 'brightness(0)' : 'none'
                                }}
                            />
                            <Link href="/profile-settings">
                                <p
                                    className={styles.pubText}
                                    style={{
                                        fontWeight: pathname === '/profile-settings' ? 'bold' : '400',
                                        color: pathname === '/profile-settings' ? '#000' : '#6B7280'
                                    }}
                                >
                                    Settings
                                </p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
