import { z } from 'zod';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const validated = schema.parse(data);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema) => validate(schema, 'params');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateBody = (schema) => validate(schema, 'body');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export const blogStatusSchema = z.enum(['draft', 'published', 'unpublished', 'trash', 'scheduled', 'review']);

export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  content: z.string().optional(),
  categories: z.array(z.string()).default([]),
  status: blogStatusSchema.default('draft'),
  published: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publicationId: z.number().int().positive().optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const publicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Invalid subdomain').optional(),
  domain: z.string().domain().optional().nullable(),
});

export const memberInvitationSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'editor', 'writer', 'viewer']),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content required').max(2000),
  parentId: z.number().int().positive().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
});
