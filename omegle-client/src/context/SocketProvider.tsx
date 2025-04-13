// src/context/SocketContext.tsx
import { createContext, useContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

type Props = {
  children: React.ReactNode;
};

export const SocketProvider = ({ children }: Props) => {
  const socket = useMemo(() => io(SERVER_URL), []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
