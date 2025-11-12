# Forgot Password Setup with Better-Auth

## Overview
The forgot password functionality has been successfully integrated with better-auth and Resend email service.

## Flow

1. **User requests password reset** (`/forgot-password`)
   - User enters their email address
   - System sends a password reset email via Resend
   - Success message is displayed

2. **User receives email**
   - Email contains a reset link with a token
   - Link redirects to `/reset-password?token=xxx`
   - Token is valid for 1 hour

3. **User resets password** (`/reset-password`)
   - User enters new password and confirms it
   - Password must be at least 8 characters
   - System validates token and updates password
   - User is redirected to login page

## Files Modified

### Server-side Configuration
- **`src/app/lib/auth.js`**
  - Added `forgetPassword` configuration
  - Configured email sending via Resend
  - Set up password reset email template

### Client-side
- **`src/lib/auth-client.js`**
  - Exported `forgetPassword` and `resetPassword` methods

- **`src/app/forgot-password/page.js`**
  - Integrated with better-auth `forgetPassword` method
  - Added loading states and error handling
  - Added success confirmation screen

- **`src/app/reset-password/page.js`** (NEW)
  - Created new page for password reset
  - Token validation from URL params
  - Password confirmation validation
  - Show/hide password toggles
  - Auto-redirect to login after success

- **`src/components/ConditionalLayout.jsx`**
  - Added `/reset-password` to auth pages list

## Usage

### For Users
1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for the reset link
4. Click the link and enter your new password
5. You'll be redirected to login

### For Developers
```javascript
// Request password reset
import { forgetPassword } from "@/lib/auth-client"

await forgetPassword({
  email: "user@example.com",
  redirectTo: "/reset-password"
})

// Reset password with token
import { resetPassword } from "@/lib/auth-client"

await resetPassword({
  newPassword: "newSecurePassword123",
  token: "reset-token-from-email"
})
```

## Email Configuration

The system uses Resend to send password reset emails. Make sure these environment variables are set:

```env
RESEND_API_KEY=your_resend_api_key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### ⚠️ Important: Resend Free Plan Limitation

With Resend's free plan, you can **only send emails to verified email addresses**:

1. Go to https://resend.com/audiences
2. Click "Add Email" and enter your email address
3. Verify your email by clicking the link they send
4. Now you can receive password reset emails at that address

Alternatively, you can use `delivered@resend.dev` for testing (Resend's test inbox).

## Security Features

- ✅ Token-based password reset (expires in 1 hour)
- ✅ Password strength validation (minimum 8 characters)
- ✅ Password confirmation matching
- ✅ Secure email delivery via Resend
- ✅ Error handling for invalid/expired tokens
- ✅ User feedback at every step

## Testing

1. Start your development server
2. Navigate to `/forgot-password`
3. Enter a valid email address from your database
4. Check your email inbox
5. Click the reset link
6. Enter and confirm your new password
7. Verify you can login with the new password

## Notes

- The reset link expires after 1 hour for security
- Users can request multiple reset emails
- Only the most recent token will be valid
- Email templates can be customized in `src/app/lib/auth.js`
