import 'dotenv/config';
import http from 'node:http';
import createApp from './app.js';
import initSocket from './socket.js';
import { connectDB } from './config/db.js';
import MenuItem from './models/MenuItem.js';
import seedMenu from './data/seedMenu.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await MenuItem.bulkWrite(seedMenu.map((item) => ({
    updateOne: {
      filter: { name: item.name },
      update: { $setOnInsert: item },
      upsert: true,
    },
  })));

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  // Make Socket.IO instance available to controllers via req.app.get('io')
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`[server] Order Management API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
