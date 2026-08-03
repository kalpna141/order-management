import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getApiErrorMessage, usePlaceOrderMutation } from '../store/apiSlice';

const initialForm = { name: '', address: '', phone: '' };
const ADDRESS_KEY = 'bite-express-address';
const DELIVERY_ADDRESS_KEY = 'bite-express:selected-delivery-address';

function getSavedAddress() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADDRESS_KEY)) || initialForm;
    const selectedDeliveryAddress = localStorage.getItem(DELIVERY_ADDRESS_KEY);
    return selectedDeliveryAddress ? { ...saved, address: selectedDeliveryAddress } : saved;
  } catch {
    return initialForm;
  }
}

export default function Checkout({ onOrderPlaced, onBack, coupon = null }) {
  const { items, totalAmount, clearCart } = useCart();
  const [form, setForm] = useState(getSavedAddress);
  const [savedAddress, setSavedAddress] = useState(() => {
    const saved = getSavedAddress();
    return saved.name && saved.address && /^\d{10}$/.test(saved.phone) ? saved : null;
  });
  const [editingAddress, setEditingAddress] = useState(() => {
    const saved = getSavedAddress();
    return !(saved.name && saved.address && /^\d{10}$/.test(saved.phone));
  });
  const [errors, setErrors] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placeOrder, { isLoading: submitting }] = usePlaceOrderMutation();
  const discountRate = coupon === 'SAVE30' ? 0.30 : coupon === 'SAVE20' ? 0.20 : 0;
  const discount = totalAmount * discountRate;
  const gst = (totalAmount - discount) * 0.05;
  const payableTotal = totalAmount - discount + gst;

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errs = [];
    if (!form.name.trim()) errs.push('Name is required.');
    if (!form.address.trim()) errs.push('Delivery address is required.');
    if (!/^\d{10}$/.test(form.phone)) {
      errs.push('Phone number must contain exactly 10 digits and numbers only.');
    }
    if (items.length === 0) errs.push('Your cart is empty.');
    return errs;
  }

  function saveAddress() {
    const addressErrors = [];
    if (!form.name.trim()) addressErrors.push('Name is required.');
    if (!form.address.trim()) addressErrors.push('Delivery address is required.');
    if (!/^\d{10}$/.test(form.phone)) addressErrors.push('Phone number must contain exactly 10 digits and numbers only.');
    if (addressErrors.length) {
      setErrors(addressErrors);
      return false;
    }
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(form));
    setSavedAddress(form);
    setEditingAddress(false);
    setErrors([]);
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(form));
      const order = await placeOrder({
        items: items.map((i) => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
        customer: form,
      }).unwrap();
      clearCart();
      onOrderPlaced(order);
    } catch (err) {
      setErrors([getApiErrorMessage(err)]);
    }
  }

  return (
    <section className="checkout-page">
      <button type="button" className="btn btn--link checkout-back" onClick={onBack}>
        ← Back to menu
      </button>
      <div className="checkout-heading"><div><p className="eyebrow">Checkout</p><h1>Complete your order</h1><p>Confirm your details and we’ll get cooking.</p></div><div className="checkout-progress" aria-label="Checkout progress"><span className="checkout-progress__done">✓ Cart</span><i></i><span>2 Details</span><i></i><span>3 Done</span></div></div>
      <div className="checkout-layout"><div className="checkout checkout--details"><div className="checkout-section-title"><span>1</span><div><h2>Delivery details</h2><p>Where should we bring your food?</p></div></div>
      <form onSubmit={handleSubmit} className="checkout__form" noValidate>
        {savedAddress && !editingAddress ? (
          <div className="saved-address">
            <div className="saved-address__top"><span className="saved-address__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6"/></svg></span><div className="saved-address__person"><strong>{savedAddress.name}</strong><span>Saved delivery address</span></div><button type="button" onClick={() => setEditingAddress(true)}>Edit</button></div>
            <p>{savedAddress.address}</p><p>{savedAddress.phone}</p>
          </div>
        ) : <>
        <label>
          Full name
          <input name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" />
        </label>
        <label>
          Delivery address
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="123 Main St, Springfield"
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            value={form.phone}
            onChange={(event) => setForm((previous) => ({
              ...previous,
              phone: event.target.value.replace(/\D/g, '').slice(0, 10),
            }))}
            placeholder="9876543210"
            inputMode="numeric"
            maxLength={10}
          />
        </label>
        <button type="button" className="btn address-save" onClick={saveAddress}>{savedAddress ? 'Save changes' : 'Add address'}</button>
        </>}

        {savedAddress && !editingAddress && <button type="button" className="add-address" onClick={() => { setForm(initialForm); setEditingAddress(true); }}>+ Add new address</button>}

        <div className="payment-section"><div className="checkout-section-title"><span>2</span><div><h2>Payment method</h2><p>Choose your preferred payment option.</p></div></div><div className="payment-options"><label className={paymentMethod === 'cod' ? 'payment-option payment-option--active' : 'payment-option'}><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /><span className="payment-option__icon">$</span><span><strong>Pay on delivery</strong><small>Cash or UPI at your door</small></span></label><label className={paymentMethod === 'online' ? 'payment-option payment-option--active' : 'payment-option'}><input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} /><span className="payment-option__icon">◇</span><span><strong>Pay online</strong><small>Secure digital payment</small></span></label></div>{paymentMethod === 'online' && <p className="payment-note">You’ll be redirected to secure payment after placing the order.</p>}</div>

        {errors.length > 0 && (
          <ul className="form-errors">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Placing order…' : `Place order · $${payableTotal.toFixed(2)}`}
        </button>
      </form>
      </div><aside className="checkout-summary"><p className="eyebrow">Your order</p><h2>Order summary</h2><ul>{items.map(({ menuItem, quantity }) => <li key={menuItem.id}><span><b>{quantity}×</b> {menuItem.name}</span><strong>${(menuItem.price * quantity).toFixed(2)}</strong></li>)}</ul><div className="checkout-summary__bill"><div><span>Subtotal</span><span>${totalAmount.toFixed(2)}</span></div>{coupon && <><div className="checkout-summary__coupon"><span>Coupon · {coupon}</span><b>Applied</b></div><div className="checkout-summary__discount"><span>Discount ({discountRate * 100}%)</span><span>−${discount.toFixed(2)}</span></div></>}<div><span>GST (5%)</span><span>${gst.toFixed(2)}</span></div><div className="checkout-summary__total"><span>Total amount</span><strong>${payableTotal.toFixed(2)}</strong></div></div><div className="checkout-trust">✓ Secure checkout &nbsp; · &nbsp; Freshness guaranteed</div></aside></div>
    </section>
  );
}
