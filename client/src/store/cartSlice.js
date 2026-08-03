import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      const { menuItem, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.menuItem.id === menuItem.id);
      if (existing) existing.quantity += quantity;
      else state.items.push({ menuItem, quantity });
    },
    updateQuantity: (state, action) => {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.menuItem.id !== menuItemId);
        return;
      }
      const item = state.items.find((entry) => entry.menuItem.id === menuItemId);
      if (item) item.quantity = quantity;
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.menuItem.id !== action.payload.menuItemId);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
