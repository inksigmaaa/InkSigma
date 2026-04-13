// services/emailService.js
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";
import logger from "../utils/logger.js";
import {
    createConcurrencyLimiter,
    getEnvNumber,
    withTimeout,
} from "../utils/externalOps.js";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

interface PasswordResetParams {
    email: string;
    name: string | null;
    resetUrl: string;
}

interface VerificationParams {
    email: string;
    name: string | null;
    verifyUrl: string;
}

class EmailService {
    private transporter: Transporter | null = null;

    private readonly smtpTimeoutMs = getEnvNumber(
        process.env.SMTP_OPERATION_TIMEOUT_MS,
        8000,
        500,
    );

    private readonly runSmtpOperation = createConcurrencyLimiter(
        getEnvNumber(process.env.SMTP_MAX_CONCURRENCY, 5, 1),
    );

    private getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                connectionTimeout: this.smtpTimeoutMs,
                greetingTimeout: this.smtpTimeoutMs,
                socketTimeout: this.smtpTimeoutMs,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return this.transporter;
    }

    async verify(): Promise<boolean> {
        try {
            await this.runSmtpOperation(() =>
                withTimeout(() => this.getTransporter().verify(), {
                    timeoutMs: this.smtpTimeoutMs,
                    operationName: "smtp.verify",
                }),
            );
            logger.info("[EMAIL] SMTP connection verified");
            return true;
        } catch (error) {
            logger.error({ err: error }, "[EMAIL] SMTP verification failed");
            return false;
        }
    }

    async send(params: SendEmailParams): Promise<SentMessageInfo> {
        logger.info(`[EMAIL] Sending "${params.subject}" to ${params.to}`);
        try {
            const result = (await this.runSmtpOperation(() =>
                withTimeout(
                    () =>
                        this.getTransporter().sendMail({
                            from: process.env.SMTP_FROM
                                ? `${process.env.SMTP_FROM_NAME || "InkSigma"} <${process.env.SMTP_FROM}>`
                                : process.env.SMTP_USER,
                            to: params.to,
                            subject: params.subject,
                            html: params.html,
                        }),
                    {
                        timeoutMs: this.smtpTimeoutMs,
                        operationName: "smtp.sendMail",
                    },
                ),
            )) as SentMessageInfo;
            logger.info(`[EMAIL] Sent successfully: ${result.messageId}`);
            return result;
        } catch (error) {
            logger.error({ err: error }, `[EMAIL] Failed`);
            throw error;
        }
    }

    async sendPasswordReset(params: PasswordResetParams): Promise<SentMessageInfo> {
        return this.send({
            to: params.email,
            subject: "Reset your password - InkSigma",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${params.name || "there"},</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${params.resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
                    <p>Or copy this link: ${params.resetUrl}</p>
                    <p>This link expires in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `,
        });
    }

    async sendVerification(params: VerificationParams): Promise<SentMessageInfo> {
        return this.send({
            to: params.email,
            subject: "Verify your email - InkSigma",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to InkSigma!</h2>
                    <p>Hi ${params.name || "there"},</p>
                    <p>Click the button below to verify your email:</p>
                    <a href="${params.verifyUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
                    <p>Or copy this link: ${params.verifyUrl}</p>
                    <p>This link expires in 24 hours.</p>
                </div>
            `,
        });
    }
}

export const emailService = new EmailService();
