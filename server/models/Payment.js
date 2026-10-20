import mongoose from 'mongoose';
export default mongoose.model('Payment', new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'CARD', 'DEMO'], default: 'DEMO' },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  reference: { type: String, unique: true }
}, { timestamps: true }));
