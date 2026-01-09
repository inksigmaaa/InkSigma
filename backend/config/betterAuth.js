// config/betterAuth.js
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.js";
import { emailService } from "../services/emailService.js";
import { emailValidationService } from "../services/emailValidationService.js";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
    
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        
        // Validate email before signup
        async beforeSignUp({ email }) {
            console.log(`[EMAIL-VALIDATION] Validating email: ${email}`);
            
            const validation = await emailValidationService.validateEmail(email);
            if (!validation.isValid) {
                const errorMessage = validation.errors.join(', ');
                console.log(`[EMAIL-VALIDATION] Rejected: ${email} - ${errorMessage}`);
                throw new Error(errorMessage);
            }
            
            console.log(`[EMAIL-VALIDATION] Approved: ${email}`);
        },
        
        sendResetPassword: async ({ user, url }) => {
            console.log("[BETTER-AUTH] sendResetPassword called for:", user.email);
            try {
                await emailService.sendPasswordReset({
                    email: user.email,
                    name: user.name,
                    resetUrl: url,
                });
                console.log("[BETTER-AUTH] Reset password email sent successfully");
            } catch (error) {
                console.error("[BETTER-AUTH] Failed to send reset password email:", error.message);
                throw error;
            }
        },
    },

    // Email verification configuration - this is where sendVerificationEmail should be
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            console.log("[BETTER-AUTH] sendVerificationEmail called for:", user.email);
            console.log("[BETTER-AUTH] Verification URL:", url);
            console.log("[BETTER-AUTH] Token:", token);
            
            try {
                const result = await emailService.sendVerification({
                    email: user.email,
                    name: user.name,
                    verifyUrl: url,
                });
                console.log("[BETTER-AUTH] Verification email sent successfully, result:", result?.messageId);
                return result;
            } catch (error) {
                console.error("[BETTER-AUTH] Failed to send verification email:", error.message);
                console.error("[BETTER-AUTH] Full error:", error);
                throw error;
            }
        },
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
});
