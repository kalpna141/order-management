import { Server } from 'socket.io';

/**
 * Sets up Socket.IO for real-time order status updates.
 * Clients join a room named `order_<id>` for the order they're tracking,
 * and the status simulator (or manual status updates) emits `order:status`
 * events into that room.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
    },
  });

  io.on('connection', (socket) => {
    socket.on('order:subscribe', (orderId) => {
      if (typeof orderId === 'string' && orderId) {
        socket.join(`order_${orderId}`);
      }
    });

    socket.on('order:unsubscribe', (orderId) => {
      if (typeof orderId === 'string' && orderId) {
        socket.leave(`order_${orderId}`);
      }
    });
  });

  return io;
}

export default initSocket;
