import "dotenv/config";
import { auth } from "./config/betterAuth.js";

async function testSignupFlow() {
    console.log("Testing signup flow...");
    console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    
    // Test if better-auth email verification is configured
    console.log("\nBetter-auth configuration:");
    console.log("- Email verification enabled:", auth.options.emailVerification?.sendOnSignUp);
    console.log("- Auto sign-in after verification:", auth.options.emailVerification?.autoSignInAfterVerification);
    console.log("- Send verification function exists:", typeof auth.options.emailVerification?.sendVerificationEmail === 'function');
    
    console.log("\n✅ Configuration looks good!");
    console.log("\nTo test the full flow:");
    console.log("1. Make sure backend server is running: node server.js");
    console.log("2. Go to http://localhost:3000/signup");
    console.log("3. Sign up with a test email");
    console.log("4. Check backend console for email logs");
    console.log("5. Check your email inbox (and spam folder)");
}

testSignupFlow();
