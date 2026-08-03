import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';

async function getMenu() {
  return MenuItem.find().sort({ category: 1, name: 1 });
}

async function getMenuItem(id) {
  const item = await MenuItem.findById(id).catch(() => null);
  if (!item) throw new AppError('Menu item not found', 404);
  return item;
}

async function createMenuItem(data) {
  return MenuItem.create(data);
}

async function updateMenuItem(id, data) {
  const updated = await MenuItem.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).catch(() => null);
  if (!updated) throw new AppError('Menu item not found', 404);
  return updated;
}

async function deleteMenuItem(id) {
  const deleted = await MenuItem.findByIdAndDelete(id).catch(() => null);
  if (!deleted) throw new AppError('Menu item not found', 404);
}

export { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
