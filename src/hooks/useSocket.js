import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, []);

  return socket;
}