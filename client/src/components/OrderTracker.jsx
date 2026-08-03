import { useEffect, useState } from 'react';
import { getApiErrorMessage, useGetOrderQuery } from '../store/apiSlice';
import { useOrderStatusSocket } from '../hooks/useSocket';

const STEPS = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];
const TERMINAL_STATUSES = ['Delivered', 'Cancelled'];
const POLL_INTERVAL_MS = 5000;

export default function OrderTracker({ orderId, onStartNewOrder }) {
  const [trackingComplete, setTrackingComplete] = useState(false);
  const { data: order, error } = useGetOrderQuery(orderId, {
    pollingInterval: trackingComplete ? 0 : POLL_INTERVAL_MS,
  });
  const liveStatus = useOrderStatusSocket(orderId, !trackingComplete);

  useEffect(() => {
    setTrackingComplete(false);
  }, [orderId]);

  useEffect(() => {
    const latestStatus = liveStatus || order?.status;
    if (TERMINAL_STATUSES.includes(latestStatus)) {
      setTrackingComplete(true);
    }
  }, [liveStatus, order?.status]);

  if (error) {
    return <p className="status-text status-text--error">Couldn't load order: {getApiErrorMessage(error)}</p>;
  }
  if (!order) return <p className="status-text">Loading your order…</p>;

  const currentStatus = liveStatus || order.status;
  const isCancelled = currentStatus === 'Cancelled';
  const currentStepIndex = STEPS.indexOf(currentStatus);

  return (
    <section className="tracker">
      <h2>Order #{order.id.slice(-6).toUpperCase()}</h2>
      <p className="status-text">Thanks, {order.customer.name}! Here's your live order status.</p>
      {isCancelled ? (
        <p className="tracker__cancelled">This order was cancelled.</p>
      ) : (
        <ol className="tracker__steps">
          {STEPS.map((step, index) => {
            const state = index < currentStepIndex ? 'done' : index === currentStepIndex ? 'active' : 'pending';
            return (
              <li key={step} className={`tracker__step tracker__step--${state}`}>
                <span className="tracker__dot" />
                <span>{step}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="tracker__details">
        <h3>Order summary</h3>
        <ul>
          {order.items.map((item) => (
            <li key={item.menuItemId}>
              {item.quantity} × {item.name}
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="tracker__total">
          <span>Total</span>
          <strong>${order.totalAmount.toFixed(2)}</strong>
        </div>
        <p className="tracker__address">Delivering to: {order.customer.address}</p>
      </div>
      <button type="button" className="btn btn--primary" onClick={onStartNewOrder}>Place another order</button>
    </section>
  );
}
