import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

interface IndustryNotification {
  id: string;
  eventType: string;
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: string;
}

interface BroadcastNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  priority: string;
  dismissible: boolean;
  requireAcknowledge: boolean;
  surveyData?: Record<string, any>;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  industryNotifications: IndustryNotification[];
  broadcastNotifications: BroadcastNotification[];
  addIndustryNotification: (notification: IndustryNotification) => void;
  removeIndustryNotification: (id: string) => void;
  clearIndustryNotifications: () => void;
  addBroadcastNotification: (notification: BroadcastNotification) => void;
  removeBroadcastNotification: (id: string) => void;
  clearBroadcastNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [industryNotifications, setIndustryNotifications] = useState<IndustryNotification[]>([]);
  const [broadcastNotifications, setBroadcastNotifications] = useState<BroadcastNotification[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);

      // Join user notification room
      newSocket.emit('join-notifications', user.id);

      // If admin, join admin notification room
      if (user.role === 'admin' || user.role === 'super_admin') {
        newSocket.emit('join-admin-notifications', user.id, user.role);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for industry notifications (admin only)
    newSocket.on('industry-notification', (notification: IndustryNotification) => {
      console.log('Received industry notification:', notification);
      setIndustryNotifications(prev => [notification, ...prev]);
    });

    // Listen for broadcast notifications
    newSocket.on('broadcast-notification', (notification: BroadcastNotification) => {
      console.log('Received broadcast notification:', notification);
      // Check if this broadcast is for the current user's role
      const targets = (notification as any).targets;
      if (targets && !targets.includes('all')) {
        const roleTargetMap: Record<string, string[]> = {
          user: ['users'],
          creator: ['creators'],
          agent: ['agents', 'entertainment_professionals'],
          admin: ['admins'],
          super_admin: ['super_admins', 'admins']
        };
        const userTargets = roleTargetMap[user.role] || [];
        const isTargeted = targets.some((t: string) => userTargets.includes(t) || t === 'all');
        if (!isTargeted) return;
      }
      setBroadcastNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-notifications', user.id);
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id, user?.role]);

  const addIndustryNotification = useCallback((notification: IndustryNotification) => {
    setIndustryNotifications(prev => [notification, ...prev]);
  }, []);

  const removeIndustryNotification = useCallback((id: string) => {
    setIndustryNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearIndustryNotifications = useCallback(() => {
    setIndustryNotifications([]);
  }, []);

  const addBroadcastNotification = useCallback((notification: BroadcastNotification) => {
    setBroadcastNotifications(prev => [notification, ...prev]);
  }, []);

  const removeBroadcastNotification = useCallback((id: string) => {
    setBroadcastNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearBroadcastNotifications = useCallback(() => {
    setBroadcastNotifications([]);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        industryNotifications,
        broadcastNotifications,
        addIndustryNotification,
        removeIndustryNotification,
        clearIndustryNotifications,
        addBroadcastNotification,
        removeBroadcastNotification,
        clearBroadcastNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
