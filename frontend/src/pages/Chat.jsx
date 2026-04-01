import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Phone, 
  Video,
  Image,
  File,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinConversation, leaveConversation, onNewMessage, sendMessage } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    joinConversation(conversationId);

    const unsubscribe = onNewMessage((data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }
    });

    return () => {
      leaveConversation(conversationId);
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`/api/conversations/${conversationId}`);
      setConversation(response.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      navigate('/dashboard');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/messages/conversation/${conversationId}`);
      setMessages(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('/api/messages', {
        conversationId,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationName = () => {
    if (!conversation) return 'Chargement...';
    if (conversation.isGroup) return conversation.groupName;
    const other = conversation.ConversationMembers?.find(m => m.userId !== user?.id);
    return other?.User?.name || 'Inconnu';
  };

  const getConversationStatus = () => {
    if (!conversation || conversation.isGroup) return null;
    const other = conversation.ConversationMembers?.find(m => m.userId !== user?.id);
    return other?.User?.status;
  };

  const formatMessageDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `Hier, ${format(d, 'HH:mm')}`;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="chat-header-info">
          <div className="avatar">
            {getConversationName().charAt(0).toUpperCase()}
          </div>
          <div className="chat-header-details">
            <h3>{getConversationName()}</h3>
            {getConversationStatus() && (
              <span className={`status ${getConversationStatus()}`}>
                {getConversationStatus() === 'online' ? 'En ligne' : 'Hors ligne'}
              </span>
            )}
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="btn btn-secondary">
            <Phone size={20} />
          </button>
          <button className="btn btn-secondary">
            <Video size={20} />
          </button>
          <button className="btn btn-secondary">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      <div className="messages-container">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="message-group">
            <div className="date-separator">
              <span>{format(new Date(date), 'EEEE d MMMM', { locale: fr })}</span>
            </div>
            
            {msgs.map(msg => {
              const isMine = msg.senderId === user?.id;
              const sender = msg.sender;
              
              return (
                <div key={msg.id} className={`message ${isMine ? 'mine' : 'other'}`}>
                  {!isMine && conversation?.isGroup && (
                    <div className="message-sender">
                      {sender?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="message-content">
                    {!isMine && conversation?.isGroup && (
                      <span className="sender-name">{sender?.name}</span>
                    )}
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                    <div className="message-meta">
                      <span className="message-time">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </span>
                      {isMine && (
                        <span className="message-status">
                          {msg.isRead ? (
                            <CheckCheck size={14} className="read" />
                          ) : (
                            <Check size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input" onSubmit={handleSend}>
        <button type="button" className="btn btn-secondary attach-btn">
          <Image size={20} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="input"
        />
        <button type="submit" className="btn btn-primary send-btn" disabled={!newMessage.trim()}>
          <Send size={20} />
        </button>
      </form>

      <style>{`
        .chat-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg);
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .back-btn {
          color: var(--text);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .back-btn:hover {
          background: var(--bg);
        }
        .chat-header-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .chat-header-details {
          display: flex;
          flex-direction: column;
        }
        .chat-header-details h3 {
          font-size: 1rem;
          font-weight: 600;
        }
        .chat-header-details .status {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .chat-header-details .status.online {
          color: var(--online);
        }
        .chat-header-actions {
          display: flex;
          gap: 0.5rem;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .message-group {
          margin-bottom: 1rem;
        }
        .date-separator {
          text-align: center;
          margin: 1.5rem 0;
        }
        .date-separator span {
          background: var(--border);
          color: var(--text-light);
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
        }
        .message {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          align-items: flex-start;
        }
        .message.mine {
          flex-direction: row-reverse;
        }
        .message-sender {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }
        .message-content {
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }
        .sender-name {
          font-size: 0.75rem;
          color: var(--text-light);
          margin-bottom: 0.25rem;
        }
        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          line-height: 1.4;
        }
        .message.mine .message-bubble {
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 0.25rem;
        }
        .message.other .message-bubble {
          background: var(--surface);
          border: 1px solid var(--border);
          border-bottom-left-radius: 0.25rem;
        }
        .message-meta {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .message.mine .message-meta {
          justify-content: flex-end;
        }
        .message-status .read {
          color: var(--primary);
        }
        .message-input {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        .message-input input {
          flex: 1;
        }
        .attach-btn {
          padding: 0.75rem;
        }
        .send-btn {
          padding: 0.75rem;
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default Chat;
