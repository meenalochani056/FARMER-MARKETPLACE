import { Router } from 'express';
import { farmerProducts, farmerProfile } from '../controllers/productController.js';
import { farmerReviews } from '../controllers/miscController.js';
const router = Router();
router.get('/:id', farmerProfile);
router.get('/:id/products', farmerProducts);
router.get('/:id/reviews', farmerReviews);
export default router;
