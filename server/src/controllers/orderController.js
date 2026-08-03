import * as orderService from '../services/orderService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const placeOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await orderService.placeOrder(req.body, io);
  res.status(201).json(order);
});

const getOrders = asyncHandler(async (req, res) => {
  const { phone } = req.query;
  const orders = await orderService.getOrders({ phone });
  res.status(200).json(orders);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.status(200).json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, io);
  res.status(200).json(order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await orderService.cancelOrder(req.params.id, io);
  res.status(200).json(order);
});

export { placeOrder, getOrders, getOrder, updateOrderStatus, cancelOrder };
