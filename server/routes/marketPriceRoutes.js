import { Router } from 'express';
import { createMarketPrice, deleteMarketPrice, listMarketPrices, updateMarketPrice } from '../controllers/miscController.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
const router = Router();
router.get('/', listMarketPrices);
router.post('/', authenticate, allowRoles('admin'), createMarketPrice);
router.put('/:id', authenticate, allowRoles('admin'), updateMarketPrice);
router.delete('/:id', authenticate, allowRoles('admin'), deleteMarketPrice);
export default router;
