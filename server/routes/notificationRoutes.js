import { Router } from 'express';
import { markNotificationRead, notifications } from '../controllers/miscController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', notifications);
router.put('/:id/read', markNotificationRead);
export default router;
