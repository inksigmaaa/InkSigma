import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getAuthBaseUrl, getRequiredServerEnv } from "@/config/server-env";
import { getDb } from "@/db";
import { Resend } from "resend";

function getResendClient() {
    return new Resend(getRequiredServerEnv("RESEND_API_KEY"));
}

let authInstance;

export function getAuth() {
    if (authInstance) {
        return authInstance;
    }

    authInstance = betterAuth({
        database: drizzleAdapter(getDb(), {
            provider: "pg",
        }),
        baseURL: getAuthBaseUrl(),
        secret: getRequiredServerEnv("BETTER_AUTH_SECRET"),
        emailAndPassword: {
            enabled: true,
        },

        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendEmail: async (user, url) => {
                try {
                    const result = await getResendClient().emails.send({
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
                    return result;
                } catch (error) {
                    console.error("Failed to send verification email", error);
                    throw error;
                }
            },
        },
        magicLink: {
            enabled: true,
            sendMagicLink: async ({ email, url }) => {
                try {
                    const result = await getResendClient().emails.send({
                        from: "InkSigma <onboarding@resend.dev>",
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
                    return result;
                } catch (error) {
                    console.error("Failed to send magic link", error);
                    throw error;
                }
            },
        },
        forgetPassword: {
            enabled: true,
            sendResetPassword: async ({ user, url }) => {
                try {
                    const result = await getResendClient().emails.send({
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
                    return result;
                } catch (error) {
                    console.error("Failed to send password reset email", error);
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

    return authInstance;
}
