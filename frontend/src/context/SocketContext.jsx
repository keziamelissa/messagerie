import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && !socketRef.current) {
      socketRef.current = io('http://localhost:3000', {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('[Socket] Joining conversation:', conversationId, 'Socket ID:', socketRef.current.id);
      socketRef.current.emit('join_conversation', conversationId);
      return true;
    } else {
      console.warn('[Socket] Cannot join - socket not connected. Retrying in 500ms...');
      // Retry after a short delay
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          console.log('[Socket] Retrying join conversation:', conversationId);
          socketRef.current.emit('join_conversation', conversationId);
        } else {
          console.error('[Socket] Still not connected after retry');
        }
      }, 500);
      return false;
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  }, []);

  const sendMessage = useCallback((conversationId, content, type = 'text') => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { conversationId, content, type });
    }
  }, []);

  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      console.log('[Socket] Setting up new_message listener');
      const wrappedCallback = (data) => {
        console.log('[Socket] Received new_message event:', data);
        callback(data);
      };
      socketRef.current.on('new_message', wrappedCallback);
      return () => {
        console.log('[Socket] Removing new_message listener');
        socketRef.current.off('new_message', wrappedCallback);
      };
    } else {
      console.warn('[Socket] Cannot listen - socket not connected');
    }
  }, []);

  const onNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('notification', callback);
      return () => socketRef.current.off('notification', callback);
    }
  }, []);

  const showBrowserNotification = useCallback((title, options = {}) => {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return;
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.jpeg',
        ...options
      });
      return notification;
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  }, []);
  const onUserStatusChange = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_status_change', callback);
      return () => socketRef.current.off('user_status_change', callback);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onNotification,
    onUserStatusChange,
    showBrowserNotification,
    requestNotificationPermission
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
