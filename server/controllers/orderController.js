import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { notify } from '../services/notificationService.js';
import { createLogistics } from '../services/logisticsService.js';

const transitions = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: [],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED']
};

export async function createOrder(req, res) {
  const { items, deliveryAddress } = req.body;
  if (!Array.isArray(items) || !items.length || !deliveryAddress) throw new AppError('Add products and a delivery address to continue.', 400);
  if (!deliveryAddress.name || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode) {
    throw new AppError('Complete the delivery name, address, city, state, and postal code.', 400);
  }
  if (items.some((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) throw new AppError('Every order quantity must be greater than zero.', 400);
  const grouped = new Map();
  const verifiedFarmers = await User.find({ role: 'farmer', isVerified: true }).distinct('_id');
  for (const input of items) {
    const product = await Product.findOneAndUpdate(
      { _id: input.product, farmer: { $in: verifiedFarmers }, status: 'ACTIVE', quantity: { $gte: Number(input.quantity) }, $expr: { $gte: [Number(input.quantity), '$minimumOrderQuantity'] } },
      { $inc: { quantity: -Number(input.quantity) } },
      { new: true }
    ).populate('farmer');
    if (!product) {
      for (const { items: reservedItems } of grouped.values()) {
        for (const reserved of reservedItems) await Product.updateOne({ _id: reserved.product._id }, { $inc: { quantity: reserved.quantity } });
      }
      throw new AppError('A product is unavailable or has insufficient stock. Your cart was not ordered.', 409);
    }
    const farmerId = product.farmer._id.toString();
    if (!grouped.has(farmerId)) grouped.set(farmerId, { farmer: product.farmer, items: [] });
    grouped.get(farmerId).items.push({ product, quantity: Number(input.quantity) });
  }
  const orders = [];
  try {
    for (const { farmer, items: lines } of grouped.values()) {
      const orderItems = lines.map(({ product, quantity }) => ({ product: product._id, name: product.name, image: product.images[0] || '', quantity, unit: product.quantityUnit, price: product.price }));
      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const order = await Order.create({ buyer: req.user._id, farmer: farmer._id, items: orderItems, deliveryAddress, subtotal, deliveryFee: subtotal >= 1000 ? 0 : 60, totalAmount: subtotal + (subtotal >= 1000 ? 0 : 60) });
      orders.push(await order.populate(['buyer', 'farmer']));
    }
  } catch (error) {
    for (const order of orders) await Order.deleteOne({ _id: order._id });
    for (const input of items) await Product.updateOne({ _id: input.product }, { $inc: { quantity: Number(input.quantity) } });
    throw error;
  }
  res.status(201).json({ orders });
}

export async function listOrders(req, res) {
  const filter = req.user.role === 'admin' ? {} : req.user.role === 'farmer' ? { farmer: req.user._id } : { buyer: req.user._id };
  const orders = await Order.find(filter).populate('buyer', 'name').populate('farmer', 'name district isVerified').sort({ createdAt: -1 });
  res.json({ orders });
}
export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('buyer', 'name email phone').populate('farmer', 'name district state isVerified').populate('items.product', 'images');
  if (!order) throw new AppError('Order not found.', 404);
  const allowed = req.user.role === 'admin' || order.buyer._id.equals(req.user._id) || order.farmer._id.equals(req.user._id);
  if (!allowed) throw new AppError('You are not authorized to view this order.', 403);
  res.json({ order });
}
export async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (req.user.role === 'farmer' && !order.farmer.equals(req.user._id)) throw new AppError('This is not your order.', 403);
  if (!['farmer', 'admin'].includes(req.user.role)) throw new AppError('Only the farmer or an admin can update order status.', 403);
  const status = req.body.status;
  if (!transitions[order.orderStatus]?.includes(status)) throw new AppError(`Invalid order transition from ${order.orderStatus} to ${status}.`, 400);
  if (req.user.role === 'farmer' && order.paymentStatus !== 'PAID' && !['CANCELLED', 'REJECTED'].includes(status)) throw new AppError('This order cannot be fulfilled before payment is confirmed.', 409);
  if (['CANCELLED', 'REJECTED'].includes(status)) {
    for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { quantity: item.quantity } });
    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
      await Payment.updateMany({ order: order._id, status: 'PAID' }, { status: 'REFUNDED' });
    }
  }
  order.orderStatus = status;
  await order.save();
  await notify(order.buyer, 'Order update', `Your order is now ${status.replaceAll('_', ' ').toLowerCase()}.`, 'order');
  if (status === 'READY_FOR_PICKUP') await createLogistics(await order.populate('farmer'));
  if (status === 'DELIVERED') {
    const tracking = await (await import('../models/Logistics.js')).default.findOne({ order: order._id });
    if (tracking) { tracking.status = 'DELIVERED'; await tracking.save(); }
  }
  res.json({ order });
}
