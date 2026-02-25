// validators/schemas.js
import { z } from 'zod';
import validator from 'validator';
import { BLOG_STATUS } from "../config/constants.js";
// NOTE: Domain validation logic moved to frontend (src/utils/subdomainRules.js, src/utils/domainValidation.js)
// Backend now only performs basic validation and database availability checks

// ============================================
// CUSTOM VALIDATORS
// ============================================

// Custom email validator using validator.js (more robust than Zod's built-in)
const emailValidator = z.string()
  .min(1, 'Email is required')
  .refine(
    (email) => validator.isEmail(email, {
      allow_utf8_local_part: false,
      require_tld: true,
      allow_ip_domain: false,
    }),
    { message: 'Invalid email format' }
  );

// Password validator
const passwordValidator = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

// Slug validator
const slugValidator = z.string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

// Subdomain validator - basic string validation only
// Format and reserved subdomain validation now handled on frontend
const subdomainValidator = z.string()
  .min(3, 'Subdomain must be at least 3 characters')
  .max(63, 'Subdomain must not exceed 63 characters');

// Custom domain validator - basic validation only
// Detailed format validation now handled on frontend
const customDomainValidator = z.string()
  .min(1, 'Custom domain is required');

// ============================================
// AUTH SCHEMAS
// ============================================

export const forgotPasswordSchema = z.object({
  email: emailValidator,
  redirectTo: z.string().url().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: emailValidator,
  newPassword: passwordValidator,
});

export const sendVerificationSchema = z.object({
  email: emailValidator,
  redirectTo: z.string().url().optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: emailValidator,
});

export const setPasswordSchema = z.object({
  password: passwordValidator,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resendVerificationSchema = z.object({
  email: emailValidator,
});

// ============================================
// BLOG SCHEMAS
// ============================================

export const createBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  content: z.string()
    .min(1, 'Content is required'),
  categories: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
  status: z.enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED, BLOG_STATUS.TRASH, BLOG_STATUS.SCHEDULED, BLOG_STATUS.REVIEW]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publicationId: z.number().int().positive().optional().nullable(),
});

export const updateBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .optional(),
  categories: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  status: z.enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED, BLOG_STATUS.TRASH, BLOG_STATUS.SCHEDULED, BLOG_STATUS.REVIEW]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publicationId: z.number().int().positive().optional().nullable(),
});

export const getBlogsQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  status: z.enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED, BLOG_STATUS.TRASH, BLOG_STATUS.SCHEDULED, BLOG_STATUS.REVIEW]).optional(),
  authorId: z.string().regex(/^\d+$/).transform(Number).optional(),
  publicationId: z.string().regex(/^\d+$/).transform(Number).optional(),
  categories: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(50),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default(0),
  includeUnpublished: z.enum(['true', 'false']).optional(),
});

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  blogId: z.number().int().positive(),
  content: z.string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content too long (max 2000 characters)')
    .trim(),
  parentId: z.number().int().positive().optional().nullable(),
  guestName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  guestEmail: emailValidator.optional().nullable(),
}).refine(
  (data) => {
    // If guestName is provided, it's a guest comment (no auth required)
    // If guestName is not provided, auth middleware will handle it
    return true;
  },
  { message: 'Invalid comment data' }
);

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content too long (max 2000 characters)')
    .trim(),
});

export const getCommentCountsSchema = z.object({
  blogIds: z.array(z.number().int().positive()),
});

// ============================================
// PUBLICATION SCHEMAS
// ============================================

export const createPublicationSchema = z.object({
  name: z.string()
    .min(2, 'Publication name must be at least 2 characters')
    .max(50, 'Publication name must not exceed 50 characters')
    .trim(),
  subdomain: subdomainValidator,
  description: z.string()
    .max(50, 'Description must not exceed 50 characters')
    .trim()
    .optional()
    .nullable(),
});

export const updatePublicationSchema = z.object({
  name: z.string()
    .min(2, 'Publication name must be at least 2 characters')
    .max(50, 'Publication name must not exceed 50 characters')
    .trim()
    .optional(),
  subdomain: subdomainValidator.optional(),
  customDomain: customDomainValidator.optional().nullable(),
  description: z.string()
    .max(50, 'Description must not exceed 50 characters')
    .trim()
    .optional()
    .nullable(),
});

export const checkSubdomainSchema = z.object({
  subdomain: subdomainValidator,
});

// ============================================
// MEMBER/INVITATION SCHEMAS
// ============================================

export const inviteMemberSchema = z.object({
  email: emailValidator,
  role: z.enum(['editor', 'author'], {
    message: "Invalid role. Must be 'editor' or 'author'",
  }),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const declineInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ============================================
// VIEW/SHARE TRACKING SCHEMAS
// ============================================

export const trackViewSchema = z.object({
  blogId: z.number().int().positive(),
});

export const trackShareSchema = z.object({
  blogId: z.number().int().positive(),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'whatsapp', 'copy'], {
    message: 'Invalid platform',
  }),
});

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const markNotificationReadSchema = z.object({
  notificationId: z.number().int().positive(),
});

export const markAllNotificationsReadSchema = z.object({
  userId: z.number().int().positive(),
});
