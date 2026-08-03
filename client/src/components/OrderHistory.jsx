import { useEffect, useRef, useState } from 'react';
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
  const activeRequest = useRef(null);
  const [getOrders, { data: orders = [], isFetching: loading, error }] = useLazyGetOrdersQuery();

  async function fetchOrders(lookupPhone) {
    const normalizedPhone = lookupPhone.trim();
    if (!normalizedPhone) return;
    setSearched(true);
    savePhone(normalizedPhone);
    activeRequest.current?.abort();
    const request = getOrders(normalizedPhone);
    activeRequest.current = request;
    try { await request; } finally {
      if (activeRequest.current === request) activeRequest.current = null;
    }
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
      <div className="history__hero"><div><p className="eyebrow">Order history</p><h1>Your recent orders</h1><p>Find previous orders and follow active deliveries.</p></div><span className="history__hero-icon">↻</span></div>
      <form className="history__lookup" onSubmit={handleSubmit}>
        <div className="history__lookup-icon">⌕</div><div className="history__lookup-content">
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
          <button type="submit" className="btn btn--primary" disabled={phone.length !== 10}>
            {loading ? 'Search again' : 'Find orders'}
          </button>
        </div>
        </div>
      </form>
      {error && <div className="history-error" role="alert"><div className="history-error__icon">!</div><div><strong>Unable to load your orders</strong><p>{/failed to fetch|network|timeout/i.test(getApiErrorMessage(error)) ? 'The order service is currently unreachable. Please check that the server is running and try again.' : getApiErrorMessage(error)}</p></div><button type="button" onClick={() => fetchOrders(phone)}>{loading ? 'Retry now' : 'Try again'}</button></div>}
      {searched && !loading && orders.length === 0 && !error && <div className="history-empty"><div className="history-empty__icon"><span>▤</span></div><p className="eyebrow">No order history yet</p><h2>No orders found</h2><p>We couldn’t find any orders linked to <strong>{phone}</strong>. Check the number or start something delicious.</p><div><button type="button" className="history-empty__secondary" onClick={() => setPhone('')}>Try another number</button><button type="button" className="history-empty__primary" onClick={onBack}>Start an order</button></div></div>}
      {orders.length > 0 && (
        <><div className="history__results-heading"><h2>Orders</h2><span>{orders.length} found</span></div>
        <ul className="history__list">
          {orders.map((order) => (
            <li key={order.id} className="history__item">
              <div className="history__item-icon">▤</div><div className="history__item-content">
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
              </div>
            </li>
          ))}
        </ul></>
      )}
    </section>
  );
}
