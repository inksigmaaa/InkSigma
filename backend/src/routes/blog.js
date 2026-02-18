import express from 'express';
import { BlogController } from '../controllers/blogController.js';
import { authenticate, asyncHandler } from '../middleware/index.js';
import { validateBody, validateParams, idParamSchema, createBlogSchema, updateBlogSchema, paginationSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(BlogController.getAll));
router.get('/:id', asyncHandler(BlogController.getById));
router.post('/', asyncHandler(validateBody(createBlogSchema)), asyncHandler(BlogController.create));
router.put('/:id', asyncHandler(validateParams(idParamSchema)), asyncHandler(validateBody(updateBlogSchema)), asyncHandler(BlogController.update));
router.delete('/:id', asyncHandler(validateParams(idParamSchema)), asyncHandler(BlogController.delete));
router.patch('/:id/publish', asyncHandler(validateParams(idParamSchema)), asyncHandler(BlogController.updateStatus));

export default router;
