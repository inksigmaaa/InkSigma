// Re-export all constants from individual files
export * from './app'
export * from './features'
export * from './navigation'
export * from './roadmap'

// Common constants
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  EDITOR: '/editor',
  REVIEW: '/review',
  SCHEDULE: '/schedule',
  FORGOT_PASSWORD: '/forgot-password',
  MAGIC_LINK: '/magic-link',
  BUGS_FEATURE_REQUESTS: 'https://inksigma.canny.io/'
}

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
}