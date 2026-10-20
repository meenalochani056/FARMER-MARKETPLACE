import { Router } from 'express';
import { body } from 'express-validator';
import { createPayment, getPayment, verifyPayment } from '../controllers/miscController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
const router = Router();
router.use(authenticate);
router.post('/create', body('orderId').isMongoId(), body('method').optional().isIn(['UPI', 'CARD', 'DEMO']), validate, createPayment);
router.post('/verify', body('paymentId').isMongoId(), body('success').isBoolean(), validate, async (req, res, next) => {
  req.params.id = req.body.paymentId;
  return verifyPayment(req, res, next);
});
router.post('/:id/verify', body('success').isBoolean(), validate, verifyPayment);
router.get('/:id', getPayment);
export default router;
