import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderHistory from '../components/OrderHistory';
import { CartProvider } from '../context/CartContext';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function renderHistory(props = {}) {
  return render(
    <CartProvider>
      <OrderHistory onTrackOrder={vi.fn()} onBack={vi.fn()} {...props} />
    </CartProvider>
  );
}

function respondWith(data) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));
}

const mockOrder = {
  id: 'order-abcdef123456',
  status: 'Preparing',
  totalAmount: 17.98,
  createdAt: new Date().toISOString(),
  items: [{ menuItemId: 'm1', name: 'Margherita Pizza', price: 8.99, quantity: 2 }],
};

describe('OrderHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('looks up orders by phone number and displays them', async () => {
    const user = userEvent.setup();
    respondWith([mockOrder]);

    renderHistory();

    await user.type(screen.getByLabelText(/phone number used at checkout/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /find orders/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0].url).toContain('phone=5551234567');
    expect(await screen.findByText(/Preparing/)).toBeInTheDocument();
    expect(screen.getByText(/2× Margherita Pizza/)).toBeInTheDocument();
  });

  it('shows an empty state when no orders are found', async () => {
    const user = userEvent.setup();
    respondWith([]);

    renderHistory();

    await user.type(screen.getByLabelText(/phone number used at checkout/i), '555-000-0000');
    await user.click(screen.getByRole('button', { name: /find orders/i }));

    expect(await screen.findByText(/no orders found/i)).toBeInTheDocument();
  });

  it('auto-loads orders if a phone number was previously saved', async () => {
    localStorage.setItem('bite-express:last-phone', '555-999-8888');
    respondWith([mockOrder]);

    renderHistory();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0].url).toContain('phone=5559998888');
    expect(await screen.findByText(/Preparing/)).toBeInTheDocument();
  });

  it('calls onTrackOrder when "Track this order" is clicked', async () => {
    const user = userEvent.setup();
    const onTrackOrder = vi.fn();
    respondWith([mockOrder]);

    renderHistory({ onTrackOrder });

    await user.type(screen.getByLabelText(/phone number used at checkout/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /find orders/i }));

    await user.click(await screen.findByRole('button', { name: /track this order/i }));
    expect(onTrackOrder).toHaveBeenCalledWith('order-abcdef123456');
  });
});
