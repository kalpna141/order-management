import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { validateOrderInput, validateStatusUpdate } from '../middleware/validators.js';

const router = express.Router();

router.post('/', validateOrderInput, orderController.placeOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/status', validateStatusUpdate, orderController.updateOrderStatus);
router.delete('/:id', orderController.cancelOrder);

export default router;
