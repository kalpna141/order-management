import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';
import { normalizePhone, phoneSuffixPattern } from '../utils/phone.js';
import { startSimulation, stopSimulation } from './statusSimulator.js';

async function placeOrder({ items, customer }, io) {
  let totalAmount = 0;
  const resolvedItems = [];

  for (const line of items) {
    const menuItem = await MenuItem.findById(line.menuItemId).catch(() => null);
    if (!menuItem) throw new AppError(`Menu item not found: ${line.menuItemId}`, 400);
    if (menuItem.available === false) {
      throw new AppError(`Menu item is unavailable: ${menuItem.name}`, 400);
    }

    totalAmount += menuItem.price * line.quantity;
    resolvedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: line.quantity,
    });
  }

  const order = await Order.create({
    customer: {
      ...customer,
      phoneNormalized: normalizePhone(customer.phone),
    },
    items: resolvedItems,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'Order Received',
  });

  if (process.env.NODE_ENV !== 'test') startSimulation(order.id, io);
  return order;
}

async function getOrders({ phone } = {}) {
  const normalizedPhone = normalizePhone(phone);
  const query = normalizedPhone
    ? {
        $or: [
          { 'customer.phoneNormalized': normalizedPhone },
          { 'customer.phone': { $regex: phoneSuffixPattern(phone) } },
        ],
      }
    : {};
  return Order.find(query).sort({ createdAt: -1 });
}

async function getOrder(id) {
  const order = await Order.findById(id).catch(() => null);
  if (!order) throw new AppError('Order not found', 404);
  return order;
}

async function updateOrderStatus(id, status, io) {
  const updated = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).catch(() => null);
  if (!updated) throw new AppError('Order not found', 404);

  if (status === 'Delivered' || status === 'Cancelled') stopSimulation(id);
  if (io) {
    io.to(`order_${id}`).emit('order:status', {
      orderId: id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  }
  return updated;
}

async function cancelOrder(id, io) {
  return updateOrderStatus(id, 'Cancelled', io);
}

export { placeOrder, getOrders, getOrder, updateOrderStatus, cancelOrder };
