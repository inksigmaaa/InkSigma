# Magic Link Setup

The magic link functionality has been integrated with Better Auth. To complete the setup, you need to configure an email provider.

## Email Provider Configuration

Add one of the following to your `.env.local`:

### Option 1: Resend (Recommended)
```env
RESEND_API_KEY=your_resend_api_key
```

### Option 2: Nodemailer (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### Option 3: SendGrid
```env
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Update auth.js

After adding your email provider credentials, update `src/app/lib/auth.js` to include the email provider configuration:

```javascript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
    database: db ? drizzleAdapter(db, {
        provider: "pg",
    }) : undefined,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || "default-secret-for-build-only",
    emailAndPassword: {
        enabled: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendEmail: async (user, url) => {
            // Configure your email provider here
            // Example with Resend:
            // await resend.emails.send({
            //     from: 'noreply@yourdomain.com',
            //     to: user.email,
            //     subject: 'Verify your email',
            //     html: `Click <a href="${url}">here</a> to verify your email.`
            // });
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
});
```

## Testing

Once configured, users can:
1. Go to `/magic-link`
2. Enter their email
3. Receive a magic link via email
4. Click the link to login and be redirected to `/dashboard`
