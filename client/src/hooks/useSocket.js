import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../store/apiSlice';

/**
 * Subscribes to real-time status updates for a given order over Socket.IO.
 * Falls back gracefully: if the socket can't connect, the parent component
 * (OrderTracker) still has the last known status from its initial fetch.
 */
export function useOrderStatusSocket(orderId, enabled = true) {
  const [liveStatus, setLiveStatus] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId || !enabled) return undefined;

    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('order:subscribe', orderId);
    });

    socket.on('order:status', (payload) => {
      if (payload.orderId === orderId) {
        setLiveStatus(payload.status);
      }
    });

    return () => {
      socket.emit('order:unsubscribe', orderId);
      socket.disconnect();
    };
  }, [orderId, enabled]);

  return liveStatus;
}
