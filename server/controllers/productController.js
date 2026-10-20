import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { AppError } from '../utils/errors.js';

export async function listProducts(req, res) {
  const { search, category, district, location, season, availability, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;
  const filter = availability === 'all' ? { status: { $in: ['ACTIVE', 'UNAVAILABLE'] } } : { status: 'ACTIVE', quantity: { $gt: 0 } };
  if (!req.user || req.user.role === 'buyer') {
    filter.farmer = { $in: await User.find({ role: 'farmer', isVerified: true }).distinct('_id') };
  }
  if (req.user?.role === 'farmer') filter.farmer = req.user._id;
  if (search) filter.$text = { $search: String(search).slice(0, 100) };
  if (category && mongoose.isValidObjectId(category)) filter.category = category;
  if (district || location) filter.district = new RegExp(String(district || location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (season) filter.season = season;
  if (minPrice || maxPrice) filter.price = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };
  const sortBy = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } }[sort] || { createdAt: -1 };
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const total = await Product.countDocuments(filter);
  let productQuery = Product.find(filter).populate('farmer', 'name district state rating isVerified profileImage').populate('category', 'name slug');
  let products;
  if (sort === 'rating') {
    products = await productQuery;
    products.sort((a, b) => (b.farmer?.rating || 0) - (a.farmer?.rating || 0) || b.createdAt - a.createdAt);
    products = products.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  } else {
    products = await productQuery.sort(sortBy).skip((safePage - 1) * safeLimit).limit(safeLimit);
  }
  res.json({ products, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
}
export async function getProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Product not found.', 404);
  const product = await Product.findById(req.params.id).populate('farmer', 'name district state rating ratingCount isVerified profileImage farmLocation').populate('category', 'name slug');
  if (!product) throw new AppError('Product not found.', 404);
  res.json({ product });
}
export async function createProduct(req, res) {
  if (!req.user.isVerified) throw new AppError('Your farmer profile must be verified before you can publish a listing.', 403);
  const data = { ...req.body, farmer: req.user._id };
  if (typeof data.images === 'string') data.images = [data.images];
  if (req.files?.length) data.images = req.files.map((file) => `/uploads/${file.filename}`);
  if (data.price <= 0 || data.quantity <= 0 || data.minimumOrderQuantity <= 0 || Number(data.minimumOrderQuantity || 1) > Number(data.quantity)) throw new AppError('Price, quantity and minimum order quantity must be positive, and the minimum cannot exceed available quantity.', 400);
  const product = await Product.create(data);
  res.status(201).json({ product });
}
export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);
  if (req.user.role !== 'admin' && product.farmer.toString() !== req.user._id.toString()) throw new AppError('You can only edit your own listings.', 403);
  const allowed = ['name', 'category', 'description', 'price', 'priceUnit', 'quantity', 'quantityUnit', 'minimumOrderQuantity', 'location', 'district', 'state', 'harvestDate', 'season', 'isOrganic', 'status', 'images'];
  for (const key of allowed) if (req.body[key] !== undefined) product[key] = req.body[key];
  if (req.files?.length) product.images = req.files.map((file) => `/uploads/${file.filename}`);
  if (product.price <= 0 || product.quantity < 0 || product.minimumOrderQuantity <= 0 || product.minimumOrderQuantity > product.quantity) throw new AppError('Price and minimum order quantity must be positive, and the minimum cannot exceed available quantity.', 400);
  await product.save();
  res.json({ product });
}
export async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);
  if (req.user.role !== 'admin' && product.farmer.toString() !== req.user._id.toString()) throw new AppError('You can only remove your own listings.', 403);
  product.status = 'ARCHIVED';
  await product.save();
  res.json({ message: 'Listing removed.' });
}
export async function farmerProfile(req, res) {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' }).select('name profileImage farmLocation district state isVerified verificationStatus rating ratingCount createdAt');
  if (!farmer) throw new AppError('Farmer not found.', 404);
  const [products, reviews, completedOrders] = await Promise.all([
    farmer.isVerified ? Product.find({ farmer: farmer._id, status: 'ACTIVE' }).populate('category', 'name').limit(24) : [],
    Review.find({ farmer: farmer._id }).populate('buyer', 'name').sort({ createdAt: -1 }).limit(20),
    (await import('../models/Order.js')).default.countDocuments({ farmer: farmer._id, orderStatus: 'DELIVERED' })
  ]);
  res.json({ farmer, products, reviews, completedOrders });
}
export async function farmerProducts(req, res) {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer', isVerified: true }).select('_id');
  const products = farmer ? await Product.find({ farmer: farmer._id, status: 'ACTIVE' }).populate('category', 'name') : [];
  res.json({ products });
}
