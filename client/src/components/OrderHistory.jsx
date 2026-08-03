import { useEffect, useState } from 'react';
import { getApiErrorMessage, useLazyGetOrdersQuery } from '../store/apiSlice';

const PHONE_STORAGE_KEY = 'bite-express:last-phone';

export function getSavedPhone() {
  try { return localStorage.getItem(PHONE_STORAGE_KEY) || ''; } catch { return ''; }
}

export function savePhone(phone) {
  try { localStorage.setItem(PHONE_STORAGE_KEY, phone); } catch { /* Storage may be unavailable. */ }
}

export default function OrderHistory({ onTrackOrder, onBack }) {
  const [phone, setPhone] = useState(() => getSavedPhone().replace(/\D/g, '').slice(-10));
  const [searched, setSearched] = useState(false);
  const [getOrders, { data: orders = [], isFetching: loading, error }] = useLazyGetOrdersQuery();

  async function fetchOrders(lookupPhone) {
    const normalizedPhone = lookupPhone.trim();
    if (!normalizedPhone) return;
    setSearched(true);
    savePhone(normalizedPhone);
    await getOrders(normalizedPhone);
  }

  useEffect(() => {
    if (phone) fetchOrders(phone);
    // Only auto-load the initially saved phone number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    fetchOrders(phone);
  }

  return (
    <section className="history">
      <button type="button" className="btn btn--link" onClick={onBack}>← Back to menu</button>
      <h2>Your recent orders</h2>
      <form className="history__lookup" onSubmit={handleSubmit}>
        <label htmlFor="history-phone">Phone number used at checkout</label>
        <div className="history__lookup-row">
          <input
            id="history-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            inputMode="numeric"
            maxLength={10}
          />
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Searching…' : 'Find orders'}
          </button>
        </div>
      </form>
      {error && <p className="status-text status-text--error">{getApiErrorMessage(error)}</p>}
      {searched && !loading && orders.length === 0 && !error && <p className="status-text">No orders found for that phone number.</p>}
      {orders.length > 0 && (
        <ul className="history__list">
          {orders.map((order) => (
            <li key={order.id} className="history__item">
              <div className="history__item-main">
                <span className="history__item-id">Order #{order.id.slice(-6).toUpperCase()}</span>
                <span className={`history__status history__status--${order.status.replace(/\s+/g, '-').toLowerCase()}`}>{order.status}</span>
              </div>
              <div className="history__item-meta">
                <span>{new Date(order.createdAt).toLocaleString()}</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <p className="history__item-summary">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p>
              <button type="button" className="btn btn--link" onClick={() => onTrackOrder(order.id)}>Track this order →</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
