import { beforeEach, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';

const mockItem = { id: '1', name: 'Pizza', price: 10 };
const mockItem2 = { id: '2', name: 'Burger', price: 5 };

function wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('adds an item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 2));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalAmount).toBe(20);
  });

  it('merges quantities when adding the same item twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 1));
    act(() => result.current.addItem(mockItem, 3));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(4);
  });

  it('updates quantity for a specific item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 1));
    act(() => result.current.updateQuantity(mockItem.id, 5));

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removes an item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 1));
    act(() => result.current.updateQuantity(mockItem.id, 0));

    expect(result.current.items).toHaveLength(0);
  });

  it('removes an item explicitly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 1));
    act(() => result.current.addItem(mockItem2, 1));
    act(() => result.current.removeItem(mockItem.id));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].menuItem.id).toBe(mockItem2.id);
  });

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(mockItem, 1));
    act(() => result.current.clearCart());

    expect(result.current.items).toHaveLength(0);
  });
});
