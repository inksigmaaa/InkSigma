import "dotenv/config";
import { db } from "./config/database.js";
import { user } from "./models/schema.js";
import { eq } from "drizzle-orm";
import { emailService } from "./services/emailService.js";
import crypto from "crypto";

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error("Usage: node manual-send-verification.js <email>");
    process.exit(1);
}

async function sendVerificationEmail() {
    try {
        // Find user
        const [foundUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (!foundUser) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        if (foundUser.emailVerified) {
            console.log(`✅ Email already verified: ${email}`);
            process.exit(0);
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString("hex");
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        // Send verification email
        await emailService.sendVerification({
            email: foundUser.email,
            name: foundUser.name,
            verifyUrl,
        });

        console.log(`✅ Verification email sent to: ${email}`);
        console.log(`Verification URL: ${verifyUrl}`);
        console.log(`\nNote: This is a manual test. The token won't work for actual verification.`);
        console.log(`Use the resend verification feature in the app for a working token.`);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

sendVerificationEmail();
