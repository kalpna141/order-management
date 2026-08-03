import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';

const mockItem = {
  id: 'abc123',
  name: 'Margherita Pizza',
  description: 'Classic tomato and mozzarella',
  price: 8.99,
  image: 'https://example.com/pizza.jpg',
};

function CartTotalsDisplay() {
  const { totalItems, totalAmount } = useCart();
  return (
    <div>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-amount">{totalAmount.toFixed(2)}</span>
    </div>
  );
}

function renderCard() {
  return render(
    <CartProvider>
      <MenuItemCard item={mockItem} />
      <CartTotalsDisplay />
    </CartProvider>
  );
}

describe('MenuItemCard', () => {
  it('renders the item name, description, and price', () => {
    renderCard();
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Classic tomato and mozzarella')).toBeInTheDocument();
    expect(screen.getByText('$8.99')).toBeInTheDocument();
  });

  it('increments and decrements the local quantity stepper', async () => {
    const user = userEvent.setup();
    renderCard();

    const increase = screen.getByLabelText(/increase quantity/i);
    const decrease = screen.getByLabelText(/decrease quantity/i);

    await user.click(increase);
    await user.click(increase);
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(decrease);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not let quantity go below 1', async () => {
    const user = userEvent.setup();
    renderCard();

    const decrease = screen.getByLabelText(/decrease quantity/i);
    await user.click(decrease);
    await user.click(decrease);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('adds the selected quantity to the cart', async () => {
    const user = userEvent.setup();
    renderCard();

    const increase = screen.getByLabelText(/increase quantity/i);
    await user.click(increase); // quantity = 2

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(screen.getByTestId('total-items').textContent).toBe('2');
    expect(screen.getByTestId('total-amount').textContent).toBe((8.99 * 2).toFixed(2));
  });
});
