import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../context/CartContext';
import Checkout from '../components/Checkout';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(data, ok = true) {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  }));
}

const mockMenuItem = { id: 'menu-1', name: 'Pizza', price: 10 };

function Prefill() {
  const { addItem } = useCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => addItem(mockMenuItem, 1), []);
  return null;
}

function renderCheckout({ onOrderPlaced = vi.fn(), onBack = vi.fn() } = {}) {
  const utils = render(
    <CartProvider>
      <Prefill />
      <Checkout onOrderPlaced={onOrderPlaced} onBack={onBack} />
    </CartProvider>
  );
  return { ...utils, onOrderPlaced, onBack };
}

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /add address/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/exactly 10 digits/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/delivery address/i), '123 Main St');
    await user.type(screen.getByLabelText(/phone number/i), 'abc');
    await user.click(screen.getByRole('button', { name: /add address/i }));

    expect(await screen.findByText(/exactly 10 digits/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits the order with valid data', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({ id: 'order-1', status: 'Order Received' }));
    const { onOrderPlaced } = renderCheckout();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/delivery address/i), '123 Main St');
    await user.type(screen.getByLabelText(/phone number/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /add address/i }));
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([request]) => request.url === 'http://localhost:5000/api/orders')).toBe(true));
    const request = fetchMock.mock.calls.find(([candidate]) => candidate.url === 'http://localhost:5000/api/orders')[0];
    expect(request.url).toBe('http://localhost:5000/api/orders');
    expect(await request.json()).toEqual({
      items: [{ menuItemId: 'menu-1', quantity: 1 }],
      customer: { name: 'Jane Doe', address: '123 Main St', phone: '9876543210' },
    });
    await waitFor(() => expect(onOrderPlaced).toHaveBeenCalledWith({ id: 'order-1', status: 'Order Received' }));
  });

  it('surfaces an API error without crashing', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({ message: 'Menu item unavailable' }, false));
    renderCheckout();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/delivery address/i), '123 Main St');
    await user.type(screen.getByLabelText(/phone number/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /add address/i }));
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText(/menu item unavailable/i)).toBeInTheDocument();
  });
});
