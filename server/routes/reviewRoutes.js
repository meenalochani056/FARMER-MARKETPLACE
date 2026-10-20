import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, farmerReviews } from '../controllers/miscController.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
const router = Router();
router.get('/farmers/:id/reviews', farmerReviews);
router.post('/', authenticate, allowRoles('buyer'), [body('order').isMongoId(), body('rating').isInt({ min: 1, max: 5 }), body('comment').optional().isString().isLength({ max: 1000 })], validate, createReview);
export default router;
