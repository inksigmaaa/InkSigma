import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: db ? drizzleAdapter(db, {
        provider: "pg",
    }) : undefined,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET || "default-secret-for-build-only",
    user: {
        additionalFields: {
            username: {
                type: "string",
                required: false,
            },
            bio: {
                type: "string",
                required: false,
            },
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendEmail: async (user, url) => {
            try {
                console.log('📧 Sending verification email to:', user.email);
                const result = await resend.emails.send({
                    from: "InkSigma <onboarding@resend.dev>",
                    to: user.email,
                    subject: "Verify your email - InkSigma",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Welcome to InkSigma!</h2>
                            <p>Please verify your email address by clicking the button below:</p>
                            <a href="${url}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                Verify Email
                            </a>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="color: #666; word-break: break-all;">${url}</p>
                            <p style="color: #999; font-size: 12px; margin-top: 40px;">
                                If you didn't create an account, you can safely ignore this email.
                            </p>
                        </div>
                    `
                });
                console.log('✅ Email sent successfully:', result);
            } catch (error) {
                console.error('❌ Failed to send verification email:', error);
                throw error;
            }
        },
    },
    magicLink: {
        enabled: true,
        sendMagicLink: async ({ email, url }) => {
            try {
                console.log('🔗 Sending magic link to:', email);
                const result = await resend.emails.send({
                    from: "InkSigma <onboarding@resend.dev>", // Use Resend's test domain
                    to: email,
                    subject: "Your Magic Link - InkSigma",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Login to InkSigma</h2>
                            <p>Click the button below to securely log in to your account:</p>
                            <a href="${url}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                Login to InkSigma
                            </a>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="color: #666; word-break: break-all;">${url}</p>
                            <p style="color: #999; font-size: 12px; margin-top: 40px;">
                                This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
                            </p>
                        </div>
                    `
                });
                console.log('✅ Magic link sent successfully:', result);
            } catch (error) {
                console.error('❌ Failed to send magic link:', error);
                throw error;
            }
        },
    },
    forgetPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            try {
                console.log('🔑 Sending password reset email to:', user.email);
                const result = await resend.emails.send({
                    from: "InkSigma <onboarding@resend.dev>",
                    to: user.email,
                    subject: "Reset Your Password - InkSigma",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Reset Your Password</h2>
                            <p>We received a request to reset your password for your InkSigma account.</p>
                            <p>Click the button below to reset your password:</p>
                            <a href="${url}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                Reset Password
                            </a>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="color: #666; word-break: break-all;">${url}</p>
                            <p style="color: #999; font-size: 12px; margin-top: 40px;">
                                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                            </p>
                        </div>
                    `
                });
                console.log('✅ Password reset email sent successfully:', result);
            } catch (error) {
                console.error('❌ Failed to send password reset email:', error);
                throw error;
            }
        },
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
});
