import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function FloatingMiniChat({ contact, onClose, onExpandFull }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!contact) return;
    loadChat();
    const interval = setInterval(loadChat, 4000); // Poll conversation every 4s
    return () => clearInterval(interval);
  }, [contact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, minimized]);

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function loadChat() {
    if (!contact) return;
    try {
      const data = await api.getChat(contact.id);
      setMessages(data);
    } catch (e) {
      console.warn('Error loading mini-chat:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || !contact) return;
    const text = inputMessage.trim();
    setInputMessage('');

    // Optimistic message
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: currentUser?.id,
      receiver_id: contact.id,
      message: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.sendMessage(contact.id, text);
      loadChat();
    } catch (e) {
      console.error('Error sending mini-chat message:', e);
    }
  }

  if (!contact) return null;

  const isOnline = contact.is_online === 1;

  if (minimized) {
    return (
      <div className="fb-minichat-bubble" onClick={() => setMinimized(false)}>
        <div className="d-flex align-items-center gap-2">
          <div className="fb-avatar-wrap" style={{ width: 28, height: 28 }}>
            <img
              src={contact.avatar_url || '/assets/juan_pablo_avatar.jpg'}
              alt={contact.full_name}
              className="fb-contact-avatar"
              style={{ width: 28, height: 28 }}
            />
            <span className={`fb-status-dot ${isOnline ? 'online' : 'offline'}`} style={{ width: 8, height: 8 }} />
          </div>
          <span className="small fw-bold text-truncate" style={{ maxWidth: 140 }}>
            {contact.full_name}
          </span>
        </div>
        <div className="d-flex align-items-center gap-1 ms-2">
          <button
            className="btn btn-sm p-0 text-muted"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-minichat-window">
      {/* Header */}
      <div className="fb-minichat-header">
        <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
          <div className="fb-avatar-wrap" style={{ width: 34, height: 34 }}>
            <img
              src={contact.avatar_url || '/assets/juan_pablo_avatar.jpg'}
              alt={contact.full_name}
              className="fb-contact-avatar"
              style={{ width: 34, height: 34 }}
            />
            <span className={`fb-status-dot ${isOnline ? 'online' : 'offline'}`} />
          </div>
          <div className="overflow-hidden">
            <div className="fb-minichat-name text-truncate">
              {contact.full_name}
            </div>
            <div className="fb-minichat-sub">
              {isOnline ? `🟢 ${t('chat.activeNow')}` : `⚪ ${t('chat.offline')}`}
            </div>
          </div>
        </div>

        {/* Window controls */}
        <div className="d-flex align-items-center gap-1">
          <button
            className="fb-chat-ctrl-btn"
            title="Minimize"
            onClick={() => setMinimized(true)}
          >
            <i className="bi bi-dash-lg"></i>
          </button>
          {onExpandFull && (
            <button
              className="fb-chat-ctrl-btn"
              title={t('chat.openFullMessenger')}
              onClick={() => onExpandFull(contact.id)}
            >
              <i className="bi bi-arrows-angle-expand"></i>
            </button>
          )}
          <button
            className="fb-chat-ctrl-btn"
            title="Close"
            onClick={onClose}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* Messages Body */}
      <div className="fb-minichat-body">
        {loading ? (
          <div className="text-center py-4 text-muted small">
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div>
            {language === 'en' ? 'Loading history...' : 'Cargando historial...'}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 px-3 text-muted small">
            <i className="bi bi-chat-heart fs-3 text-success d-block mb-1"></i>
            {language === 'en' ? 'Start a conversation with' : '¡Comienza la conversación con'}{' '}
            <strong>{contact.full_name}</strong>!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`fb-bubble-wrap ${isMe ? 'outgoing' : 'incoming'}`}
              >
                {!isMe && (
                  <img
                    src={contact.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                    alt=""
                    className="fb-bubble-avatar"
                  />
                )}
                <div className={`fb-bubble ${isMe ? 'me' : 'other'}`}>
                  {msg.message}
                  <div className="fb-bubble-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form className="fb-minichat-footer" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="fb-minichat-input"
          placeholder={t('chat.typeMessage')}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="fb-minichat-send"
          disabled={!inputMessage.trim()}
          title={t('chat.send')}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
}
