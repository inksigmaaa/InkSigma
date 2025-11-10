/**
 * Environment configuration
 * Centralized access to environment variables
 */

export const env = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'InkSigma',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Feature Flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableSEO: process.env.NEXT_PUBLIC_ENABLE_SEO === 'true',
  
  // External Services
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}

/**
 * Validate required environment variables
 */
export const validateEnv = () => {
  const required = []
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
