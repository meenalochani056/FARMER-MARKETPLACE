import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], required: true },
  buyerType: { type: String, enum: ['individual', 'retailer', 'bulk'], default: 'individual' },
  profileImage: { type: String, default: '' },
  farmLocation: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: 'Tamil Nadu' },
  address: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
