# Email Setup Guide for InkSigma

This guide will help you set up email functionality for magic links and email verification.

## Using Resend (Recommended)

### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "InkSigma Development")
4. Copy the API key (starts with `re_`)

### Step 3: Add to Environment Variables

Add to your `.env.local` file:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 4: Test with Resend's Test Domain

For development, use Resend's test domain `onboarding@resend.dev`:

```javascript
from: "InkSigma <onboarding@resend.dev>"
```

**Important:** With the test domain, you can only send emails to:
- The email address you used to sign up for Resend
- Any email addresses you've added to your Resend account

### Step 5: Verify Your Own Domain (Production)

For production, you'll want to use your own domain:

1. Go to [Domains](https://resend.com/domains) in Resend
2. Click "Add Domain"
3. Enter your domain (e.g., `inksigma.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually takes a few minutes)
6. Update the `from` address in `src/app/lib/auth.js`:

```javascript
from: "InkSigma <noreply@inksigma.com>"
```

## Testing Magic Links

### 1. Start Your Development Server

```bash
npm run dev
```

### 2. Try Magic Link Login

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Login with Magic link"
3. Enter your email (must be the email you used for Resend account)
4. Check your email inbox
5. Click the magic link

### 3. Check Console Logs

The auth configuration now includes console logs:

```
🔗 Sending magic link to: your@email.com
✅ Magic link sent successfully: { id: '...' }
```

Or if there's an error:

```
❌ Failed to send magic link: Error details...
```

## Troubleshooting

### Issue: "No email received"

**Solutions:**

1. **Check your Resend account email**
   - Magic links only work with the email you used to sign up for Resend
   - Or emails you've added to your Resend account

2. **Check spam folder**
   - Sometimes emails end up in spam

3. **Verify API key**
   - Make sure `RESEND_API_KEY` is set in `.env.local`
   - Check that the key starts with `re_`
   - No extra spaces or quotes

4. **Check console logs**
   - Look for error messages in your terminal
   - Check browser console for errors

5. **Restart dev server**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Issue: "API key invalid"

- Go to [Resend API Keys](https://resend.com/api-keys)
- Delete the old key
- Create a new one
- Update `.env.local`
- Restart dev server

### Issue: "Domain not verified"

For production:
- Check [Resend Domains](https://resend.com/domains)
- Verify DNS records are added correctly
- Wait 5-10 minutes for propagation
- Click "Verify" button

## Email Templates

The current templates include:

### Magic Link Email
- Clean, branded design
- Large "Login" button
- Fallback link for copy/paste
- 15-minute expiration notice

### Verification Email
- Welcome message
- "Verify Email" button
- Fallback link
- Security notice

## Rate Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month

For production, consider upgrading to a paid plan.

## Alternative: Using Gmail SMTP

If you prefer to use Gmail instead of Resend:

1. Install nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Update `src/app/lib/auth.js` to use nodemailer
3. Add Gmail credentials to `.env.local`:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

4. Enable "App Passwords" in your Google Account settings

## Production Checklist

Before deploying to production:

- [ ] Verify your domain in Resend
- [ ] Update `from` address to use your domain
- [ ] Test magic links with multiple email addresses
- [ ] Set up proper error monitoring
- [ ] Consider email rate limiting
- [ ] Add unsubscribe links (if sending marketing emails)
- [ ] Review Resend's pricing and upgrade if needed

## Support

- Resend Documentation: [resend.com/docs](https://resend.com/docs)
- Resend Support: [resend.com/support](https://resend.com/support)
- Better Auth Docs: [better-auth.com](https://better-auth.com)
