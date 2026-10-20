import mongoose from 'mongoose';
export default mongoose.model('Logistics', new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  pickupLocation: { type: String, default: '' },
  deliveryLocation: { type: String, default: '' },
  deliveryPartner: { type: String, default: 'FarmLink Demo Logistics' },
  trackingId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['PICKUP_REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'], default: 'PICKUP_REQUESTED' },
  estimatedDelivery: { type: Date }
}, { timestamps: true }));
