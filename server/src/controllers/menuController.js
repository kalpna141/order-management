import * as menuService from '../services/menuService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getMenu = asyncHandler(async (req, res) => {
  const items = await menuService.getMenu();
  res.status(200).json(items);
});

const getMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.getMenuItem(req.params.id);
  res.status(200).json(item);
});

const createMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.createMenuItem(req.body);
  res.status(201).json(item);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.updateMenuItem(req.params.id, req.body);
  res.status(200).json(item);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  await menuService.deleteMenuItem(req.params.id);
  res.status(204).send();
});

export { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
