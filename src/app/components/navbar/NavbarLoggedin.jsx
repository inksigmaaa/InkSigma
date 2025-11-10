import styles from './NavbarLoggedin.module.css'

export default function NavbarLoggedin() {
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
                    <div className={styles.userProfile}>
                        <img src="/images/icons/profileuser.svg" alt="usericon" className={styles.userProfileImg} />
                        <div className={styles.profileName}>
                            Grace Mathew
                            <span className={styles.down}>
                                <img src="/images/icons/down.svg" alt="" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}