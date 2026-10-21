import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

function tokenFor(user) {
  const secret = process.env.JWT_SECRET || 'FarmLink_Production_JWT_Secret_2026_SecureKey';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });
}
function safeUser(user) {
  const result = user.toObject();
  delete result.password;
  return result;
}
export async function register(req, res) {
  const existing = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existing) throw new AppError('Email is already registered.', 409);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    password: await bcrypt.hash(req.body.password, 10),
    role: req.body.role || 'buyer',
    phone: req.body.phone || '',
    farmLocation: req.body.farmLocation || '',
    district: req.body.district || '',
    state: req.body.state || '',
    buyerType: req.body.buyerType || 'individual',
    isVerified: req.body.role === 'admin'
  });
  res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}
export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    throw new AppError('Invalid credentials provided.', 401);
  }
  res.json({ token: tokenFor(user), user: safeUser(user) });
}
export async function currentUser(req, res) {
  res.json({ user: safeUser(req.user) });
}
export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id);
  const updatable = ['name', 'phone', 'farmLocation', 'district', 'state', 'buyerType', 'address'];
  for (const field of updatable) {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  }
  await user.save();
  res.json({ user: safeUser(user) });
}
