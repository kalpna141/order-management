import { useCart } from '../context/CartContext';

export default function Cart({ onCheckout, isOpen = true, onClose, coupon, setCoupon }) {
  const { items, totalItems, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const discountRate = coupon === 'SAVE30' ? 0.30 : coupon === 'SAVE20' ? 0.20 : 0;
  const discount = totalAmount * discountRate;
  const discountedSubtotal = totalAmount - discount;
  const gst = discountedSubtotal * 0.05;
  const finalTotal = discountedSubtotal + gst;

  function handleClearCart() {
    clearCart();
    setCoupon(null);
  }

  return (
    <div className={`cart-overlay ${isOpen ? 'cart-overlay--open' : ''}`} aria-hidden={!isOpen} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
    <aside className="cart" role="dialog" aria-modal="true" aria-label="Your cart">
      <div className="cart__heading"><h2>Your Cart {totalItems > 0 && <span className="cart__badge">{totalItems}</span>}</h2><button type="button" className="cart__close" aria-label="Close cart" onClick={onClose}>×</button></div>

      {items.length === 0 ? (
        <div className="cart-empty"><div className="cart-empty__icon"><span>🛒</span></div><h3>Your cart feels light</h3><p>Add something delicious from the menu and it’ll appear right here.</p><button type="button" onClick={onClose}>Explore the menu</button></div>
      ) : (
        <>
          <div className="cart__items-scroll">
          <div className="cart__utility"><span>{totalItems} item{totalItems === 1 ? '' : 's'}</span><button type="button" onClick={handleClearCart}>Clear cart</button></div>
          <ul className="cart__list">
            {items.map(({ menuItem, quantity }) => (
              <li key={menuItem.id} className="cart__item">
                <div className="cart__item-info">
                  <span className="cart__item-name">{menuItem.name}</span>
                  <span className="cart__item-price">${(menuItem.price * quantity).toFixed(2)}</span>
                </div>
                <div className="cart__item-controls">
                  <div className="qty-stepper qty-stepper--small">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${menuItem.name}`}
                      onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${menuItem.name}`}
                      onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn--link"
                    onClick={() => removeItem(menuItem.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          </div>

          <div className="cart__footer">
          <div className="coupon-box">
            <div className="coupon-box__heading"><strong>Offers for you</strong><span>Choose one coupon</span></div>
            {['SAVE20', 'SAVE30'].map((code) => (
              <button key={code} type="button" className={coupon === code ? 'coupon coupon--active' : 'coupon'} onClick={() => setCoupon(coupon === code ? null : code)}>
                <span><strong>{code}</strong><small>{code === 'SAVE20' ? '20% off your order' : '30% off your order'}</small></span><b>{coupon === code ? 'Applied' : 'Apply'}</b>
              </button>
            ))}
          </div>

          <div className="cart__bill">
            <div><span>Subtotal</span><span>${totalAmount.toFixed(2)}</span></div>
            {discount > 0 && <div className="cart__discount"><span>Coupon discount</span><span>−${discount.toFixed(2)}</span></div>}
            <div><span>GST (5%)</span><span>${gst.toFixed(2)}</span></div>
            <div className="cart__total"><span>Total</span><span>${finalTotal.toFixed(2)}</span></div>
          </div>

          <button type="button" className="btn btn--primary btn--full" onClick={onCheckout}>
            Proceed to checkout
          </button>
          </div>
        </>
      )}
    </aside></div>
  );
}
