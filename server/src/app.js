import express from 'express';
import cors from 'cors';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
