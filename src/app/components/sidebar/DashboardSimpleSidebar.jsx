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
                        <div 
                            className={styles.spaceIcon}
                            onMouseEnter={(e) => {
                                if (pathname !== '/dashboard') {
                                    const img = e.currentTarget.querySelector('img')
                                    const text = e.currentTarget.querySelector('p')
                                    if (img) img.style.filter = 'brightness(0)'
                                    if (text) text.style.color = '#2E2E2E'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (pathname !== '/dashboard') {
                                    const img = e.currentTarget.querySelector('img')
                                    const text = e.currentTarget.querySelector('p')
                                    if (img) img.style.filter = 'none'
                                    if (text) text.style.color = '#B0B0B0'
                                }
                            }}
                        >
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
                                        color: pathname === '/dashboard' ? '#2E2E2E' : '#B0B0B0',
                                        transition: 'color 0.2s'
                                    }}
                                >
                                    My Space
                                </p>
                            </Link>
                        </div>
                    </div>
                    <div className={styles.settings} style={{ borderTop: 'none', borderBottom: 'none' }}>
                        <div 
                            className={styles.pubIcon}
                            onMouseEnter={(e) => {
                                if (pathname !== '/profile-settings') {
                                    const img = e.currentTarget.querySelector('img')
                                    const text = e.currentTarget.querySelector('p')
                                    if (img) {
                                        img.style.opacity = '1'
                                        img.style.filter = 'brightness(0)'
                                    }
                                    if (text) text.style.color = '#2E2E2E'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (pathname !== '/profile-settings') {
                                    const img = e.currentTarget.querySelector('img')
                                    const text = e.currentTarget.querySelector('p')
                                    if (img) {
                                        img.style.opacity = '0.6'
                                        img.style.filter = 'none'
                                    }
                                    if (text) text.style.color = '#B0B0B0'
                                }
                            }}
                        >
                            <img
                                src="/icons/settings.svg"
                                alt="settingsicon"
                                className={styles.sideLogo}
                                style={{
                                    height:'24px',
                                    width:'24px',
                                    opacity: pathname === '/profile-settings' ? '1' : '0.6',
                                    filter: pathname === '/profile-settings' ? 'brightness(0)' : 'none',
                                    transition: 'opacity 0.2s, filter 0.2s'
                                }}
                            />
                            <Link href="/profile-settings">
                                <p
                                    className={styles.pubText}
                                    style={{
                                        fontSize:'14px',
                                        fontWeight: pathname === '/profile-settings' ? 'bold' : '400',
                                        color: pathname === '/profile-settings' ? '#2E2E2E' : '#B0B0B0',
                                        transition: 'color 0.2s'
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
