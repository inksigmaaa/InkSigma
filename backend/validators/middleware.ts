// validators/middleware.js
import { ZodError } from 'zod';
import logger from "../utils/logger.js";

/**
 * Validation middleware factory
 * Creates Express middleware that validates request data against a Zod schema
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data from: 'body', 'query', 'params'
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      // Get data from specified source
      const dataToValidate = req[source];
      
      // Validate and parse data
      const validated = await schema.parseAsync(dataToValidate);
      
      // Replace request data with validated/transformed data
      req[source] = validated;
      
      // Add validated data to a separate property for easy access
      req.validated = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      
      // Handle unexpected errors
      logger.error(error, '[VALIDATION] Unexpected error:');
      return res.status(500).json({
        error: 'Validation error',
        message: error.message,
      });
    }
  };
};

/**
 * Validate request body
 * Shorthand for validate(schema, 'body')
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 * Shorthand for validate(schema, 'query')
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 * Shorthand for validate(schema, 'params')
 */
export const validateParams = (schema) => validate(schema, 'params');
