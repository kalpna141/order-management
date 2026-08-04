import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import cartReducer from './cartSlice';

const CART_STORAGE_KEY = 'bite-express:cart';

function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return cart && Array.isArray(cart.items) ? cart : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function makeStore() {
  const store = configureStore({
    reducer: { cart: cartReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: { cart: loadCart() },
  });
  store.subscribe(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(store.getState().cart)); }
    catch { /* Storage may be unavailable. */ }
  });
  return store;
}
