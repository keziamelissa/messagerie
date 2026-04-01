import React, { createContext, useContext, useEffect, useRef } from 'react';
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

  const joinConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  };

  const sendMessage = (conversationId, content, type = 'text') => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { conversationId, content, type });
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
      return () => socketRef.current.off('new_message', callback);
    }
  };

  const onNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('notification', callback);
      return () => socketRef.current.off('notification', callback);
    }
  };

  const value = {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
