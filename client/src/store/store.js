import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import cartReducer from './cartSlice';

export function makeStore() {
  return configureStore({
    reducer: { cart: cartReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}
