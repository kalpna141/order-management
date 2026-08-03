import { useCart } from '../context/CartContext';

export default function Cart({ onCheckout }) {
  const { items, totalItems, totalAmount, updateQuantity, removeItem } = useCart();

  return (
    <aside className="cart">
      <h2>Your Cart {totalItems > 0 && <span className="cart__badge">{totalItems}</span>}</h2>

      {items.length === 0 ? (
        <p className="status-text">Your cart is empty. Add something tasty!</p>
      ) : (
        <>
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

          <div className="cart__total">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          <button type="button" className="btn btn--primary btn--full" onClick={onCheckout}>
            Proceed to checkout
          </button>
        </>
      )}
    </aside>
  );
}
