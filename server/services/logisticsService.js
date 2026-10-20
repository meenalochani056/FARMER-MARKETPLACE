import Logistics from '../models/Logistics.js';
import Order from '../models/Order.js';
import { AppError } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function createLogistics(order) {
  return Logistics.findOneAndUpdate({ order: order._id }, {
    $setOnInsert: {
      order: order._id,
      pickupLocation: order.farmer?.farmLocation || '',
      deliveryLocation: [order.deliveryAddress?.city, order.deliveryAddress?.state].filter(Boolean).join(', '),
      trackingId: `FM-${Date.now().toString(36).toUpperCase()}`
    }
  }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

export async function updateLogistics(orderId, status) {
  const tracking = await Logistics.findOne({ order: orderId });
  if (!tracking) throw new AppError('Tracking record not found.', 404);
  const transitions = {
    PICKUP_REQUESTED: ['PICKUP_SCHEDULED'],
    PICKUP_SCHEDULED: ['PICKED_UP'],
    PICKED_UP: ['IN_TRANSIT'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED']
  };
  if (tracking.status !== status && !transitions[tracking.status]?.includes(status)) throw new AppError(`Invalid delivery transition from ${tracking.status} to ${status}.`, 400);
  tracking.status = status;
  await tracking.save();
  const order = await Order.findById(orderId);
  if (order) {
    if (status === 'PICKED_UP' && order.orderStatus === 'READY_FOR_PICKUP') order.orderStatus = 'PICKED_UP';
    if (status === 'OUT_FOR_DELIVERY' && order.orderStatus === 'PICKED_UP') order.orderStatus = 'OUT_FOR_DELIVERY';
    if (status === 'DELIVERED' && order.orderStatus === 'OUT_FOR_DELIVERY') order.orderStatus = 'DELIVERED';
    await order.save();
    await notify(order.buyer, 'Delivery update', `Your delivery is now ${status.replaceAll('_', ' ').toLowerCase()}.`, 'delivery');
  }
  return tracking;
}
