"use client"

import styles from './VisitSiteButton.module.css'

export default function VisitSiteButton() {
  return (
    <a 
      href="/" 
      target="_blank"
      rel="noopener noreferrer"
      className={styles.visitButton}
    >
      Visit site
    </a>
  )
}
