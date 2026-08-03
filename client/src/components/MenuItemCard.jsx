import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function MenuItemCard({ item }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    addItem(item, quantity);
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="menu-card">
      <img className="menu-card__image" src={item.image} alt={item.name} loading="lazy" />
      <div className="menu-card__body">
        <div className="menu-card__header">
          <h3>{item.name}</h3>
          <span className="menu-card__price">${item.price.toFixed(2)}</span>
        </div>
        <p className="menu-card__description">{item.description}</p>
        <div className="menu-card__footer">
          <div className="qty-stepper">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={handleAdd}>
            {justAdded ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
