// config/betterAuth.js
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.js";
import { emailService } from "../services/emailService.js";
import { emailValidationService } from "../services/emailValidationService.js";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    basePath: "/api/auth",
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
    
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

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
            await emailService.sendPasswordReset({
                email: user.email,
                name: user.name,
                resetUrl: url,
            });
        },
        
        sendVerificationEmail: async ({ user, url }) => {
            console.log("[BETTER-AUTH] sendVerificationEmail called for:", user.email);
            await emailService.sendVerification({
                email: user.email,
                name: user.name,
                verifyUrl: url,
            });
        },
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
});
