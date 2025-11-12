import styles from './Verify.module.css'

export default function Verify() {
    return (
        <div className={styles.verifyContainer}>
            <div className={styles.verifyBox}>
                <div className={styles.messageSection}>
                    <img src="/images/icons/alert.svg" alt="alert" className={styles.alertIcon} />
                    <p className={styles.messageText}>Your Account is unverified.</p>
                </div>
                <button className={styles.verifyButton}>Verify your Account</button>
            </div>
        </div>
    )
}