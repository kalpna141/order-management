import { useMemo, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { makeStore } from '../store/store';
import {
  addItem as addItemAction,
  clearCart as clearCartAction,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
} from '../store/cartSlice';

export function CartProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = makeStore();
  return <Provider store={storeRef.current}>{children}</Provider>;
}

export function useCart() {
  const items = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  return useMemo(() => ({
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.quantity * item.menuItem.price, 0),
    addItem: (menuItem, quantity = 1) => {
      dispatch(addItemAction({ menuItem, quantity }));
    },
    updateQuantity: (menuItemId, quantity) => {
      dispatch(updateQuantityAction({ menuItemId, quantity }));
    },
    removeItem: (menuItemId) => {
      dispatch(removeItemAction({ menuItemId }));
    },
    clearCart: () => {
      dispatch(clearCartAction());
    },
  }), [dispatch, items]);
}
