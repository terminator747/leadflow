import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(brokerageId, handlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!brokerageId) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        transports: ["websocket", "polling"]
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinBrokerage", brokerageId);
    });

    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        if (handler) socket.off(event, handler);
      });

      socket.disconnect();
      socketRef.current = null;
    };
  }, [brokerageId]);

  return socketRef;
}
