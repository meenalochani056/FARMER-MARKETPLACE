import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { AppError } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function createPayment(order, buyer, method = 'DEMO') {
  if (order.buyer.toString() !== buyer._id.toString()) throw new AppError('Order not found.', 404);
  if (order.paymentStatus !== 'PENDING' || order.orderStatus !== 'PENDING') throw new AppError('This order is not awaiting payment.');
  return Payment.create({ order: order._id, buyer: buyer._id, amount: order.totalAmount, method, reference: `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}` });
}

export async function verifyPayment(payment, success) {
  const status = success ? 'PAID' : 'FAILED';
  const claimedPayment = await Payment.findOneAndUpdate({ _id: payment._id, status: 'PENDING' }, { status }, { new: true });
  if (!claimedPayment) throw new AppError('This payment has already been processed.', 409);
  const order = await Order.findOneAndUpdate(
    { _id: payment.order, paymentStatus: 'PENDING', orderStatus: 'PENDING' },
    { paymentStatus: status, orderStatus: success ? 'CONFIRMED' : 'CANCELLED' },
    { new: true }
  );
  if (!order) {
    await Payment.updateOne({ _id: payment._id, status }, { status: 'FAILED' });
    throw new AppError('This order is no longer awaiting payment.', 409);
  }
  if (!success) {
    const Product = (await import('../models/Product.js')).default;
    for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { quantity: item.quantity } });
  }
  await notify(order.buyer, success ? 'Demo payment successful' : 'Demo payment failed', success ? `Payment recorded for order ${order._id}. No money was transferred.` : `Payment for order ${order._id} failed.`, 'payment');
  await notify(order.farmer, success ? 'New order received' : 'Payment failed', `Order ${order._id} payment is ${status.toLowerCase()}.`, 'order');
  return { payment: claimedPayment, order };
}
