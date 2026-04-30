import { Resend } from "resend";
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
    text?: string;
}

interface SendEmailResult {
    id: string;
    messageId: string;
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
    private resend: Resend | null = null;

    private readonly resendTimeoutMs = getEnvNumber(
        process.env.RESEND_OPERATION_TIMEOUT_MS,
        8000,
        500,
    );

    private readonly runResendOperation = createConcurrencyLimiter(
        getEnvNumber(process.env.RESEND_MAX_CONCURRENCY, 5, 1),
    );

    private getApiKey(): string {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) {
            throw new Error("RESEND_API_KEY is required to send email");
        }
        return apiKey;
    }

    private getResend(): Resend {
        if (!this.resend) {
            this.resend = new Resend(this.getApiKey());
        }
        return this.resend;
    }

    private getFromAddress(): string {
        const configuredFrom = process.env.RESEND_FROM?.trim();
        if (configuredFrom) return configuredFrom;

        const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

        if (!fromEmail) {
            throw new Error("RESEND_FROM or RESEND_FROM_EMAIL is required to send email");
        }

        const fromName = process.env.RESEND_FROM_NAME?.trim() || "InkSigma";

        return `${fromName} <${fromEmail}>`;
    }

    isConfigured(): boolean {
        return Boolean(
            process.env.RESEND_API_KEY?.trim() &&
            (process.env.RESEND_FROM?.trim() ||
                process.env.RESEND_FROM_EMAIL?.trim()),
        );
    }

    async verify(): Promise<boolean> {
        try {
            this.getApiKey();
            this.getFromAddress();
            this.getResend();
            logger.info("[EMAIL] Resend configuration verified");
            return true;
        } catch (error) {
            logger.error({ err: error }, "[EMAIL] Resend configuration failed");
            return false;
        }
    }

    async send(params: SendEmailParams): Promise<SendEmailResult> {
        logger.info(`[EMAIL] Sending "${params.subject}" to ${params.to}`);
        try {
            const result = await this.runResendOperation(() =>
                withTimeout(
                    async () => {
                        const { data, error } = await this.getResend().emails.send({
                            from: this.getFromAddress(),
                            to: params.to,
                            subject: params.subject,
                            html: params.html,
                            ...(params.text ? { text: params.text } : {}),
                        });

                        if (error) {
                            throw new Error(error.message);
                        }

                        if (!data?.id) {
                            throw new Error("Resend did not return an email id");
                        }

                        return {
                            id: data.id,
                            messageId: data.id,
                        };
                    },
                    {
                        timeoutMs: this.resendTimeoutMs,
                        operationName: "resend.emails.send",
                    },
                ),
            );
            logger.info(`[EMAIL] Sent successfully: ${result.messageId}`);
            return result;
        } catch (error) {
            logger.error({ err: error }, `[EMAIL] Failed`);
            throw error;
        }
    }

    async sendPasswordReset(params: PasswordResetParams): Promise<SendEmailResult> {
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

    async sendVerification(params: VerificationParams): Promise<SendEmailResult> {
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
