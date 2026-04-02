import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  LogOut, 
  Search,
  User,
  Bell,
  Check
} from 'lucide-react';
import logo from '../photo/logo.jpeg';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function Dashboard() {
  const { user, logout } = useAuth();
  const { onNotification, onUserStatusChange, showBrowserNotification, requestNotificationPermission } = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(0);
  const [notificationList, setNotificationList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    fetchNotifications();
    
    // Request browser notification permission
    requestNotificationPermission();

    const unsubscribeNotification = onNotification((data) => {
      console.log('[Dashboard] Received notification:', data);
      setNotifications(prev => prev + 1);
      fetchConversations();
      
      // Play sound alert
      playNotificationSound();
      
      // Show browser notification if user is not focused on the page
      if (document.hidden) {
        const notification = showBrowserNotification('Nouveau message', {
          body: data.content || 'Vous avez reçu une notification',
          tag: data.id,
          requireInteraction: false
        });
        
        // Handle notification click
        if (notification) {
          notification.onclick = () => {
            window.focus();
            notification.close();
            // Navigate to the conversation if available
            if (data.conversationId) {
              navigate(`/chat/${data.conversationId}`);
            }
          };
        }
      } else {
        // Show in-app toast notification
        const toastId = Date.now();
        setToasts(prev => [...prev, { id: toastId, content: data.content || 'Nouvelle notification' }]);
        
        // Remove toast after 4 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 4000);
      }
    });

    const unsubscribeStatus = onUserStatusChange((data) => {
      console.log('[Dashboard] User status changed:', data);
      setConversations(prev => prev.map(conv => {
        // Update status for users in this conversation
        const updatedMembers = conv.members?.map(member => {
          if (member.id === data.userId) {
            return { ...member, status: data.status };
          }
          return member;
        });
        return { ...conv, members: updatedMembers };
      }));
      // Also update users list
      setUsers(prev => prev.map(u => 
        u.id === data.userId ? { ...u, status: data.status } : u
      ));
    });

    // Poll for notifications every 30 seconds (for when user comes back online)
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Check notifications when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Dashboard] User returned to tab, checking notifications...');
        fetchNotifications();
        fetchConversations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (unsubscribeNotification) unsubscribeNotification();
      if (unsubscribeStatus) unsubscribeStatus();
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/conversations/my');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setNotifications(response.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Audio alert for new notifications
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not supported');
    }
  };

  const fetchAllNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotificationList(response.data);
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotificationList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotificationList(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifications(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchAllNotifications();
    }
  };

  const handleNotificationItemClick = async (notification) => {
    console.log('[Dashboard] Clicked notification:', notification);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to conversation if available
    if (notification.conversationId) {
      console.log('[Dashboard] Navigating to conversation:', notification.conversationId);
      navigate(`/chat/${notification.conversationId}`);
      setShowNotifications(false);
    } else {
      console.warn('[Dashboard] No conversationId for this notification');
      // For old notifications without conversationId, just close the panel
      setShowNotifications(false);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    const members = [user.id, ...selectedUsers];

    try {
      await axios.post('/api/conversations', {
        members,
        isGroup,
        groupName: isGroup ? groupName : null
      });
      setShowNewConv(false);
      setSelectedUsers([]);
      setGroupName('');
      fetchConversations();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put('/api/users/profile', {
        name: editName,
        email: editEmail
      });
      setShowEditProfile(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getOtherUser = (conversation) => {
    if (!conversation.ConversationMembers) return null;
    const other = conversation.ConversationMembers.find(
      m => m.userId !== user?.id
    );
    return other?.User;
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img src={logo} alt="PingMe" className="logo-img" />
            <span>PingMe</span>
          </div>
        </div>

        <button className="btn btn-primary new-conv-btn" onClick={() => setShowNewConv(true)}>
          <Plus size={20} />
          Nouvelle conversation
        </button>

        <div className="conversations-list">
          <h3>Conversations</h3>
          {conversations.length === 0 ? (
            <p className="empty">Aucune conversation</p>
          ) : (
            conversations.map(conv => {
              const otherUser = getOtherUser(conv);
              return (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="conversation-item"
                >
                  <div className="avatar conversation-avatar">
                    {conv.isGroup ? (
                      <Users size={18} />
                    ) : (
                      otherUser?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="conversation-info">
                    <span className="conversation-name">
                      {conv.isGroup ? conv.groupName : (otherUser?.name || 'Inconnu')}
                    </span>
                    <span className="conversation-preview">
                      {conv.isGroup ? `${conv.ConversationMembers?.length || 0} membres` : otherUser?.email}
                    </span>
                  </div>
                  {!conv.isGroup && otherUser && (
                    <span className={`status-dot ${otherUser.status}`} />
                  )}
                </Link>
              );
            })
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => { setEditName(user?.name || ''); setEditEmail(user?.email || ''); setShowEditProfile(true); }}>
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className={`user-status ${user?.status}`}>
                {user?.status === 'online' ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary logout-btn" onClick={logout}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2>Mes Conversations</h2>
          <div className="header-actions">
            <button className="btn btn-secondary notification-btn" onClick={handleNotificationClick}>
              <Bell size={20} />
              {notifications > 0 && <span className="badge">{notifications}</span>}
            </button>
          </div>
        </header>

        <div className="welcome-section">
          <h1>Bienvenue, {user?.name} !</h1>
          <p>Sélectionnez une conversation ou créez-en une nouvelle pour commencer à discuter.</p>
        </div>
      </main>

      {showNotifications && (
        <div className="notification-overlay" onClick={() => setShowNotifications(false)}>
          <div className="notification-panel" onClick={e => e.stopPropagation()}>
            <div className="notification-header">
              <h3>Notifications</h3>
              {notificationList.some(n => !n.isRead) && (
                <button className="btn btn-text" onClick={markAllAsRead}>
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="notification-list">
              {notificationList.length === 0 ? (
                <p className="no-notifications">Aucune notification</p>
              ) : (
                notificationList.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationItemClick(notification)}
                  >
                    <div className="notification-content">
                      <p className="notification-text">{notification.content}</p>
                      <span className="notification-time">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    {!notification.isRead && <div className="notification-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showNewConv && (
        <div className="modal-overlay" onClick={() => setShowNewConv(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nouvelle conversation</h3>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                />
                Créer un groupe
              </label>
            </div>

            {isGroup && (
              <div className="form-group">
                <label>Nom du groupe</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Mon groupe"
                  className="input"
                />
              </div>
            )}

            <div className="form-group">
              <label>Sélectionner des utilisateurs</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="input"
                />
              </div>
            </div>

            <div className="users-list">
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className={`user-item ${selectedUsers.includes(u.id) ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(u.id)}
                >
                  <div className="avatar">{u.name.charAt(0).toUpperCase()}</div>
                  <div className="user-item-info">
                    <span className="user-item-name">{u.name}</span>
                    <span className="user-item-email">{u.email}</span>
                  </div>
                  {selectedUsers.includes(u.id) && <Check size={18} className="check-icon" />}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNewConv(false)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateConversation}
                disabled={selectedUsers.length === 0 || (isGroup && !groupName)}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Modifier mon profil</h3>

            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Votre nom"
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditProfile(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleUpdateProfile}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <span>{toast.content}</span>
          </div>
        ))}
      </div>

      <style>{`
        .dashboard {
          display: flex;
          height: 100vh;
        }
        .sidebar {
          width: 320px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--primary);
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .logo-img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 600;
        }
        .user-status {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .user-status.online {
          color: var(--online);
        }
        .new-conv-btn {
          margin: 1rem;
          justify-content: center;
        }
        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 1rem;
        }
        .conversations-list h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-light);
          margin-bottom: 0.75rem;
        }
        .conversation-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s;
        }
        .conversation-item:hover {
          background: var(--bg);
        }
        .conversation-item .avatar {
          width: 36px;
          height: 36px;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .conversation-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .conversation-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conversation-preview {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .user-profile:hover {
          background: var(--bg);
        }
        .logout-btn {
          width: 100%;
          justify-content: center;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .main-header h2 {
          font-size: 1.25rem;
        }
        .header-actions {
          position: relative;
        }
        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--error);
          color: white;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }
        .notification-btn {
          position: relative;
        }
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .toast {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1rem 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
          max-width: 300px;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .notification-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
        }
        .notification-panel {
          position: absolute;
          top: 70px;
          right: 20px;
          width: 360px;
          max-height: 500px;
          background: var(--surface);
          border-radius: 1rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .notification-header h3 {
          font-size: 1rem;
          font-weight: 600;
        }
        .btn-text {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }
        .btn-text:hover {
          background: var(--bg);
          border-radius: 0.25rem;
        }
        .notification-list {
          overflow-y: auto;
          max-height: 400px;
        }
        .no-notifications {
          text-align: center;
          padding: 2rem;
          color: var(--text-light);
        }
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .notification-item:hover {
          background: var(--bg);
        }
        .notification-item.unread {
          background: #eef2ff;
        }
        .notification-content {
          flex: 1;
        }
        .notification-text {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          color: var(--text);
        }
        .notification-time {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .notification-dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 0.375rem;
        }
        .welcome-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }
        .welcome-section h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .welcome-section p {
          color: var(--text-light);
          max-width: 400px;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          background: var(--surface);
          border-radius: 1rem;
          padding: 1.5rem;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal h3 {
          margin-bottom: 1rem;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg);
          padding: 0.5rem;
          border-radius: 0.5rem;
        }
        .search-box input {
          background: transparent;
          border: none;
          outline: none;
        }
        .users-list {
          max-height: 250px;
          overflow-y: auto;
          margin: 1rem 0;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
        }
        .user-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .user-item:hover {
          background: var(--bg);
        }
        .user-item.selected {
          background: #eef2ff;
        }
        .user-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .user-item-name {
          font-weight: 500;
        }
        .user-item-email {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .check {
          color: var(--primary);
          font-weight: bold;
        }
        .check-icon {
          color: var(--primary);
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: auto;
            max-height: 40vh;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .conversations-list {
            max-height: 200px;
          }
          .main-content {
            flex: 1;
          }
          .welcome-section h1 {
            font-size: 1.5rem;
          }
          .modal {
            width: 95%;
            margin: 1rem;
          }
          .users-list {
            max-height: 200px;
          }
        }
        @media (max-width: 480px) {
          .sidebar-header {
            padding: 1rem;
          }
          .user-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .new-conv-btn {
            margin: 0.75rem;
          }
          .main-header {
            padding: 0.75rem 1rem;
          }
          .main-header h2 {
            font-size: 1rem;
          }
          .welcome-section {
            padding: 1rem;
          }
          .welcome-section h1 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
