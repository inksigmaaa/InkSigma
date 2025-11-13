"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import styles from './NavbarLoggedin.module.css'

export default function NavbarLoggedin() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()

    const handleProfileSettings = () => {
        setIsDropdownOpen(false)
        router.push('/dashboard/settings')
    }

    const handleLogout = () => {
        setIsDropdownOpen(false)
        // Add your logout logic here
        router.push('/login')
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.navContainer}>
                <div className={styles.logo}>
                    <a href="/">
                        <img src="/icons/inksigma-logo.svg" alt="Inksigma logo" />
                    </a>
                </div>
                <div className={styles.profileSection}>
                    <div className={styles.notification}>
                        <img src="/images/icons/Notification.svg" alt="notification" />
                    </div>
                    <div className={styles.userProfile} style={{ position: 'relative' }}>
                        <img 
                            src={session?.user?.image || "/images/icons/profileuser.svg"} 
                            alt="usericon" 
                            className={styles.userProfileImg}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div 
                            className={styles.profileName}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ cursor: 'pointer' }}
                        >
                            {session?.user?.name || session?.user?.email || 'User'}
                            <span className={styles.down}>
                                <img src="/images/icons/down.svg" alt="" />
                            </span>
                        </div>
                        
                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                minWidth: '180px',
                                zIndex: 50
                            }}>
                                <button
                                    onClick={handleProfileSettings}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        color: '#374151',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    Profile Setting
                                </button>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        color: '#374151',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}