// services/emailService.js
import nodemailer from "nodemailer";

class EmailService {
    constructor() {
        this.transporter = null;
    }

    getTransporter() {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return this.transporter;
    }

    async verify() {
        try {
            await this.getTransporter().verify();
            console.log("[EMAIL] SMTP connection verified");
            return true;
        } catch (error) {
            console.error("[EMAIL] SMTP verification failed:", error.message);
            return false;
        }
    }

    async send({ to, subject, html }) {
        console.log(`[EMAIL] Sending "${subject}" to ${to}`);
        try {
            const result = await this.getTransporter().sendMail({
                from: process.env.SMTP_USER,
                to,
                subject,
                html,
            });
            console.log(`[EMAIL] Sent successfully: ${result.messageId}`);
            return result;
        } catch (error) {
            console.error(`[EMAIL] Failed:`, error.message);
            throw error;
        }
    }

    async sendPasswordReset({ email, name, resetUrl }) {
        return this.send({
            to: email,
            subject: "Reset your password - InkSigma",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${name || "there"},</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
                    <p>Or copy this link: ${resetUrl}</p>
                    <p>This link expires in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `,
        });
    }

    async sendVerification({ email, name, verifyUrl }) {
        return this.send({
            to: email,
            subject: "Verify your email - InkSigma",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to InkSigma!</h2>
                    <p>Hi ${name || "there"},</p>
                    <p>Click the button below to verify your email:</p>
                    <a href="${verifyUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
                    <p>Or copy this link: ${verifyUrl}</p>
                    <p>This link expires in 24 hours.</p>
                </div>
            `,
        });
    }
}

export const emailService = new EmailService();