import Order from '../models/Order.js';

export const PROGRESSION = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];

const STEP_MS = Number(process.env.STATUS_STEP_MS) || 8000;

const activeTimers = new Map();


export function startSimulation(orderId, io) {
  let stepIndex = PROGRESSION.indexOf('Order Received');

  function scheduleNext() {
    const timer = setTimeout(async () => {
      stepIndex += 1;
      if (stepIndex >= PROGRESSION.length) {
        activeTimers.delete(orderId);
        return;
      }

      const nextStatus = PROGRESSION[stepIndex];
      const updated = await Order.findByIdAndUpdate(
        orderId,
        { status: nextStatus },
        { new: true, runValidators: true }
      ).catch(() => null);

      // Order may have been cancelled/deleted in the meantime.
      if (updated && io) {
        io.to(`order_${orderId}`).emit('order:status', {
          orderId,
          status: updated.status,
          updatedAt: updated.updatedAt,
        });
      }

      if (stepIndex < PROGRESSION.length - 1 && updated) {
        scheduleNext();
      } else {
        activeTimers.delete(orderId);
      }
    }, STEP_MS);

    activeTimers.set(orderId, timer);
  }

  scheduleNext();
}

export function stopSimulation(orderId) {
  const timer = activeTimers.get(orderId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(orderId);
  }
}
