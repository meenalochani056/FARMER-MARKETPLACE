import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

function tokenFor(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function safeUser(user) {
  const result = user.toObject();
  delete result.password;
  return result;
}
export async function register(req, res) {
  const { name, email, phone, password, role, buyerType } = req.body;
  if (!['farmer', 'buyer'].includes(role)) throw new AppError('Choose farmer or buyer to register.', 400);
  if (String(password || '').length < 8) throw new AppError('Password must be at least 8 characters long.', 400);
  if (await User.exists({ email })) throw new AppError('An account with this email already exists.', 409);
  const user = await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role, buyerType });
  res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}
export async function login(req, res) {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) throw new AppError('Email or password is incorrect.', 401);
  res.json({ token: tokenFor(user), user: safeUser(user) });
}
export async function currentUser(req, res) { res.json({ user: safeUser(req.user) }); }
export async function updateProfile(req, res) {
  const allowed = ['name', 'phone', 'profileImage', 'farmLocation', 'district', 'state', 'address', 'buyerType'];
  for (const key of allowed) if (req.body[key] !== undefined) req.user[key] = req.body[key];
  if (req.file) req.user.profileImage = `/uploads/${req.file.filename}`;
  await req.user.save();
  res.json({ user: safeUser(req.user) });
}
