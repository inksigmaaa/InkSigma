import "dotenv/config";
import { emailService } from "./services/emailService.js";

async function testEmail() {
    console.log("Testing email service...");
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    
    // Verify connection
    const isReady = await emailService.verify();
    if (!isReady) {
        console.error("❌ SMTP connection failed");
        process.exit(1);
    }
    
    console.log("✅ SMTP connection successful");
    
    // Send test verification email
    try {
        const result = await emailService.sendVerification({
            email: process.env.SMTP_USER, // Send to yourself for testing
            name: "Test User",
            verifyUrl: "http://localhost:3000/verify-email?token=test123",
        });
        console.log("✅ Test email sent successfully:", result.messageId);
    } catch (error) {
        console.error("❌ Failed to send test email:", error);
    }
}

testEmail();
