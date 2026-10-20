import mongoose from 'mongoose';
import MarketPrice from '../models/MarketPrice.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Payment from '../models/Payment.js';
import Logistics from '../models/Logistics.js';
import { AppError } from '../utils/errors.js';
import { notify } from '../services/notificationService.js';
import { createPayment as makePayment, verifyPayment as processPayment } from '../services/paymentService.js';
import { updateLogistics as changeLogistics } from '../services/logisticsService.js';

export async function createPayment(req, res) {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw new AppError('Order not found.', 404);
  res.status(201).json({ payment: await makePayment(order, req.user, req.body.method) });
}
export async function verifyPayment(req, res) {
  const payment = await Payment.findById(req.params.id);
  if (!payment || (req.user.role !== 'admin' && !payment.buyer.equals(req.user._id))) throw new AppError('Payment not found.', 404);
  const result = await processPayment(payment, req.body.success === true);
  res.json({ payment: result.payment, order: result.order, demo: true, message: 'This is a simulated demonstration payment; no money was transferred.' });
}
export async function getPayment(req, res) {
  const payment = await Payment.findById(req.params.id).populate('order');
  if (!payment || (req.user.role !== 'admin' && !payment.buyer.equals(req.user._id))) throw new AppError('Payment not found.', 404);
  res.json({ payment });
}
export async function listMarketPrices(req, res) {
  const filter = {};
  if (req.query.crop) filter.crop = new RegExp(String(req.query.crop), 'i');
  if (req.query.location) filter.location = new RegExp(String(req.query.location), 'i');
  res.json({ marketPrices: await MarketPrice.find(filter).sort({ updatedAt: -1 }) });
}
function validatePriceRange(minimumPrice, averagePrice, maximumPrice) {
  const values = [minimumPrice, averagePrice, maximumPrice].map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0) || values[0] > values[1] || values[1] > values[2]) {
    throw new AppError('Prices must be non-negative and ordered minimum ≤ average ≤ maximum.', 400);
  }
}
export async function createMarketPrice(req, res) {
  validatePriceRange(req.body.minimumPrice, req.body.averagePrice, req.body.maximumPrice);
  res.status(201).json({ marketPrice: await MarketPrice.create({ ...req.body, isDemoData: true }) });
}
export async function updateMarketPrice(req, res) {
  const marketPrice = await MarketPrice.findById(req.params.id);
  if (!marketPrice) throw new AppError('Market price not found.', 404);
  for (const key of ['crop', 'market', 'location', 'minimumPrice', 'averagePrice', 'maximumPrice', 'unit']) {
    if (req.body[key] !== undefined) marketPrice[key] = req.body[key];
  }
  validatePriceRange(marketPrice.minimumPrice, marketPrice.averagePrice, marketPrice.maximumPrice);
  marketPrice.isDemoData = true;
  await marketPrice.save();
  res.json({ marketPrice });
}
export async function deleteMarketPrice(req, res) {
  const result = await MarketPrice.findByIdAndDelete(req.params.id);
  if (!result) throw new AppError('Market price not found.', 404);
  res.json({ message: 'Market price removed.' });
}
export async function createReview(req, res) {
  const { order: orderId, rating, comment } = req.body;
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) throw new AppError('Rating must be an integer between 1 and 5.', 400);
  const order = await Order.findById(orderId);
  if (!order || !order.buyer.equals(req.user._id)) throw new AppError('Order not found.', 404);
  if (order.orderStatus !== 'DELIVERED') throw new AppError('You can review an order only after delivery.', 400);
  if (await Review.exists({ order: order._id })) throw new AppError('This order already has a review.', 409);
  const review = await Review.create({ order: order._id, buyer: req.user._id, farmer: order.farmer, rating: Number(rating), comment });
  const stats = await Review.aggregate([{ $match: { farmer: order.farmer } }, { $group: { _id: '$farmer', rating: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  await User.findByIdAndUpdate(order.farmer, { rating: stats[0].rating, ratingCount: stats[0].count });
  await notify(order.farmer, 'New farmer review', `A buyer left you a ${rating}-star review.`, 'review');
  res.status(201).json({ review });
}
export async function farmerReviews(req, res) {
  res.json({ reviews: await Review.find({ farmer: req.params.id }).populate('buyer', 'name').sort({ createdAt: -1 }) });
}
export async function notifications(req, res) {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications: items });
}
export async function markNotificationRead(req, res) {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!item) throw new AppError('Notification not found.', 404);
  res.json({ notification: item });
}
export async function tracking(req, res) {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new AppError('Order not found.', 404);
  if (req.user.role !== 'admin' && !order.buyer.equals(req.user._id) && !order.farmer.equals(req.user._id)) throw new AppError('You are not authorized to view tracking.', 403);
  const logistics = await Logistics.findOne({ order: order._id });
  res.json({ logistics });
}
export async function updateTracking(req, res) {
  const order = await Order.findById(req.params.orderId);
  if (!order || (req.user.role !== 'admin' && !order.farmer.equals(req.user._id))) throw new AppError('Order not found.', 404);
  const logistics = await changeLogistics(order._id, req.body.status);
  res.json({ logistics });
}
export async function createTracking(req, res) {
  const order = await Order.findById(req.body.orderId).populate('farmer');
  if (!order) throw new AppError('Order not found.', 404);
  if (!order.farmer._id.equals(req.user._id) && req.user.role !== 'admin') throw new AppError('You are not authorized to create tracking.', 403);
  const { createLogistics } = await import('../services/logisticsService.js');
  res.status(201).json({ logistics: await createLogistics(order) });
}
export async function adminStats(req, res) {
  const [farmers, verifiedFarmers, buyers, products, orders, completedOrders, revenue, pendingVerification] = await Promise.all([
    User.countDocuments({ role: 'farmer' }), User.countDocuments({ role: 'farmer', isVerified: true }), User.countDocuments({ role: 'buyer' }),
    Product.countDocuments({ status: { $ne: 'ARCHIVED' } }), Order.countDocuments(), Order.countDocuments({ orderStatus: 'DELIVERED' }),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    User.countDocuments({ role: 'farmer', verificationStatus: 'Pending' })
  ]);
  res.json({ stats: { farmers, verifiedFarmers, buyers, products, orders, completedOrders, revenue: revenue[0]?.total || 0, pendingVerification } });
}
export async function adminUsers(req, res) {
  const role = req.originalUrl.endsWith('/farmers') ? 'farmer' : 'buyer';
  res.json({ users: await User.find({ role }).select('-password').sort({ createdAt: -1 }) });
}
export async function verifyFarmer(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Farmer not found.', 404);
  const status = req.body.status;
  if (!['verified', 'rejected'].includes(status)) throw new AppError('Status must be verified or rejected.', 400);
  const farmer = await User.findOneAndUpdate({ _id: req.params.id, role: 'farmer' }, { isVerified: status === 'verified', verificationStatus: status === 'verified' ? 'Verified' : 'Rejected' }, { new: true });
  if (!farmer) throw new AppError('Farmer not found.', 404);
  await notify(farmer._id, 'Verification status updated', `Your farmer account is ${farmer.verificationStatus.toLowerCase()}.`, 'verification');
  res.json({ farmer });
}
export async function adminList(req, res) {
  const resource = req.params.resource;
  const models = { products: Product, orders: Order, payments: Payment, logistics: Logistics, reviews: Review, categories: Category, farmers: User, buyers: User, 'market-prices': MarketPrice };
  const model = models[resource];
  if (!model) throw new AppError('Unknown resource.', 404);
  const query = resource === 'farmers' ? { role: 'farmer' } : resource === 'buyers' ? { role: 'buyer' } : {};
  const records = await model.find(query).sort({ createdAt: -1 }).limit(200).populate(resource === 'orders' ? ['buyer', 'farmer'] : []);
  res.json({ records });
}
export async function createCategory(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) throw new AppError('Category name is required.', 400);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  res.status(201).json({ category: await Category.create({ name, slug, description: req.body.description || '' }) });
}
export async function updateCategory(req, res) {
  const updates = {};
  if (req.body.name) {
    updates.name = String(req.body.name).trim();
    updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (req.body.description !== undefined) updates.description = req.body.description;
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) throw new AppError('Category not found.', 404);
  res.json({ category });
}
export async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found.', 404);
  if (await Product.exists({ category: category._id, status: { $ne: 'ARCHIVED' } })) throw new AppError('Move or archive this category’s active listings before removing it.', 409);
  await category.deleteOne();
  res.json({ message: 'Category removed.' });
}
