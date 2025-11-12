import styles from './FeedbackButton.module.css'
import { FeedbackIcon } from './icons/SvgIcons'

export default function FeedbackButton() {
  return (
    <a 
      href="https://inksigma.canny.io/" 
      target="_blank"
      rel="noopener noreferrer"
      className={styles.feedbackButton}
      title="Send Feedback"
    >
      <FeedbackIcon />
    </a>
  )
}
