import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getApiErrorMessage, usePlaceOrderMutation } from '../store/apiSlice';

const initialForm = { name: '', address: '', phone: '' };

export default function Checkout({ onOrderPlaced, onBack }) {
  const { items, totalAmount, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [placeOrder, { isLoading: submitting }] = usePlaceOrderMutation();

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

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    try {
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
    <section className="checkout">
      <button type="button" className="btn btn--link" onClick={onBack}>
        ← Back to menu
      </button>
      <h2>Delivery details</h2>

      <form onSubmit={handleSubmit} className="checkout__form" noValidate>
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

        {errors.length > 0 && (
          <ul className="form-errors">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <div className="checkout__summary">
          <span>Order total</span>
          <strong>${totalAmount.toFixed(2)}</strong>
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </section>
  );
}
