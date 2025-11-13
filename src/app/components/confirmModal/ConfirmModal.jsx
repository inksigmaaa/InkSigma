import styles from './ConfirmModal.module.css'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmStyle = 'danger' }) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title} style={{ color: confirmStyle === 'danger' ? '#DC2626' : '#1F2937' }}>
          {title}
        </h2>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.buttons}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
            style={{ 
              backgroundColor: confirmStyle === 'danger' ? '#000000' : '#000000',
              color: '#FFFFFF'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
