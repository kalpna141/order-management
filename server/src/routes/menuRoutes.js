import express from 'express';
import * as menuController from '../controllers/menuController.js';
import { validateMenuItem } from '../middleware/validators.js';

const router = express.Router();

router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItem);
router.post('/', validateMenuItem, menuController.createMenuItem);
router.put('/:id', validateMenuItem, menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

export default router;
