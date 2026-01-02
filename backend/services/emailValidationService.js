// services/emailValidationService.js
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

class EmailValidationService {
    // Common disposable email domains
    disposableDomains = [
        'fake.com', 'dummy.com', 'test.com', 'example.com',
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'temp-mail.org',
        'throwaway.email', 'getnada.com', 'maildrop.cc',
        'sharklasers.com', 'grr.la', 'guerrillamailblock.com'
    ];

    // Basic email format validation
    isValidFormat(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check if domain is disposable
    isDisposableDomain(email) {
        const domain = email.split('@')[1]?.toLowerCase();
        return this.disposableDomains.includes(domain);
    }

    // Check if domain has MX record (indicates real email server)
    async hasMxRecord(email) {
        try {
            const domain = email.split('@')[1];
            const mxRecords = await resolveMx(domain);
            return mxRecords && mxRecords.length > 0;
        } catch (error) {
            console.log(`[EMAIL-VALIDATION] No MX record for domain: ${email.split('@')[1]}`);
            return false;
        }
    }

    // Comprehensive email validation
    async validateEmail(email) {
        const errors = [];

        // Format check
        if (!this.isValidFormat(email)) {
            errors.push('Invalid email format');
        }

        // Disposable domain check
        if (this.isDisposableDomain(email)) {
            errors.push('Temporary email addresses are not allowed');
        }

        // MX record check (optional - can be slow)
        if (process.env.VALIDATE_EMAIL_MX === 'true') {
            const hasMx = await this.hasMxRecord(email);
            if (!hasMx) {
                errors.push('Email domain does not exist');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export const emailValidationService = new EmailValidationService();