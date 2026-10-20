import mongoose from 'mongoose';
export default mongoose.model('MarketPrice', new mongoose.Schema({
  crop: { type: String, required: true },
  market: { type: String, required: true },
  location: { type: String, required: true },
  minimumPrice: { type: Number, required: true, min: 0 },
  maximumPrice: { type: Number, required: true, min: 0 },
  averagePrice: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  isDemoData: { type: Boolean, default: true }
}, { timestamps: { createdAt: false, updatedAt: true } }));
