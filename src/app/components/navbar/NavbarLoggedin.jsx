"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./NavbarLoggedin.module.css";

export default function NavbarLoggedin() {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

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

                    {/* Wrapper only */}
                    <div ref={wrapperRef} className={styles.userProfileWrapper}>

                        {/* Click target only */}
                        <div
                            className={styles.userProfile}
                            onClick={() => setOpen((prev) => !prev)}
                        >
                            <img
                                src="/images/icons/profileuser.svg"
                                alt="usericon"
                                className={styles.userProfileImg}
                            />
                            <div className={styles.profileName}>
                                Grace Mathew
                                <span className={styles.down}>
                                    <img src="/images/icons/down.svg" alt="dropdown" />
                                </span>
                            </div>
                        </div>

                        {/* Dropdown */}
                        {open && (
                            <div
                                className={styles.dropdownMenu}
                                onClick={(e) => e.stopPropagation()} // ✅ prevents closing from inner click
                            >
                                <a href="/profile" className={styles.dropdownItem}>
                                    Profile Settings
                                </a>
                                <a href="/home" className={styles.dropdownItem}>
                                    Publication
                                </a>
                                <button className={styles.dropdownItem}>Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
