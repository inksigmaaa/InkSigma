// services/emailValidationService.js
import dns from 'dns';
import { promisify } from 'util';
import validator from 'validator';
import { createRequire } from 'module';
import logger from "../utils/logger.js";

const require = createRequire(import.meta.url);
const disposableDomains = require('disposable-email-domains');

const resolveMx = promisify(dns.resolveMx);

class EmailValidationService {
    /**
     * Validate email format using validator.js (RFC 5322 compliant)
     * Handles 100+ edge cases that simple regex misses
     */
    isValidFormat(email) {
        return validator.isEmail(email, {
            allow_utf8_local_part: false,  // Don't allow UTF-8 characters in local part
            require_tld: true,              // Require top-level domain (.com, .org, etc.)
            allow_ip_domain: false,         // Don't allow IP addresses as domain
            domain_specific_validation: true, // Enable domain-specific validation
        });
    }

    /**
     * Check if domain is disposable/temporary
     * Uses disposable-email-domains package (10,000+ domains)
     */
    isDisposableDomain(email) {
        const domain = email.split('@')[1]?.toLowerCase();
        return disposableDomains.includes(domain);
    }

    /**
     * Check if domain has MX record (indicates real email server)
     * This is an optional check as it can be slow
     */
    async hasMxRecord(email) {
        try {
            const domain = email.split('@')[1];
            const mxRecords = await resolveMx(domain);
            return mxRecords && mxRecords.length > 0;
        } catch (error) {
            logger.info(`[EMAIL-VALIDATION] No MX record for domain: ${email.split('@')[1]}`);
            return false;
        }
    }

    /**
     * Comprehensive email validation
     * Returns validation result with detailed errors
     */
    async validateEmail(email) {
        const errors = [];

        // 1. Format check (RFC 5322 compliant)
        if (!this.isValidFormat(email)) {
            errors.push('Invalid email format');
        }

        // 2. Disposable domain check (10,000+ domains)
        if (this.isDisposableDomain(email)) {
            errors.push('Temporary email addresses are not allowed');
        }

        // 3. MX record check (optional - can be slow)
        // Only run if VALIDATE_EMAIL_MX is enabled in .env
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

    /**
     * Quick synchronous validation (format + disposable check only)
     * Use this when you don't need MX record validation
     */
    validateEmailSync(email) {
        const errors = [];

        if (!this.isValidFormat(email)) {
            errors.push('Invalid email format');
        }

        if (this.isDisposableDomain(email)) {
            errors.push('Temporary email addresses are not allowed');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export const emailValidationService = new EmailValidationService();
