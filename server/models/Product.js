import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, default: '' },
  images: [{ type: String }],
  price: { type: Number, required: true, min: 0.01 },
  priceUnit: { type: String, default: 'kg' },
  quantity: { type: Number, required: true, min: 0 },
  quantityUnit: { type: String, default: 'kg' },
  minimumOrderQuantity: { type: Number, default: 1, min: 0.01 },
  location: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: 'Tamil Nadu' },
  harvestDate: { type: Date },
  season: { type: String, default: '' },
  isOrganic: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'UNAVAILABLE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text' });
export default mongoose.model('Product', productSchema);
