import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function MessagesView({ initialTargetUserId, onClearTargetUser }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allFriends, setAllFriends] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadFriends();
  }, [currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    setLoading(true);
    try {
      const list = await api.getConversations();
      setConversations(list || []);

      if (initialTargetUserId) {
        openChat(initialTargetUserId);
        if (onClearTargetUser) onClearTargetUser();
      } else if (list && list.length > 0 && !selectedPartner) {
        openChat(list[0].user.id);
      } else if (!selectedPartner) {
        // Fallback open chat with Camila (id: 2) or Juan Pablo
        const partnerId = currentUser?.id === 1 ? 2 : 1;
        openChat(partnerId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFriends() {
    try {
      const friends = await api.getFriends();
      setAllFriends(friends || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function openChat(targetId) {
    try {
      const chatData = await api.getChat(targetId);
      setMessages(chatData || []);

      const user = await api.getUserById(targetId);
      setSelectedPartner(user);

      // Refresh conversations count
      const list = await api.getConversations();
      setConversations(list || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    setSending(true);
    try {
      const text = newMessage;
      setNewMessage('');

      // Optimistic append
      const tempMsg = {
        id: 'temp-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: selectedPartner.id,
        message: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);

      await api.sendMessage(selectedPartner.id, text);
      const updatedChat = await api.getChat(selectedPartner.id);
      setMessages(updatedChat);
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error sending message' : 'Error al enviar mensaje'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="content-wrapper">
      <div className="sena-card p-0 d-flex flex-column flex-md-row overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 145px)', minHeight: '520px' }}>
        {/* Left Side: Conversations List */}
        <div className="border-end d-flex flex-column bg-white" style={{ width: '100%', maxWidth: '340px' }}>
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-0 text-dark">
              <i className="bi bi-chat-dots-fill text-primary me-2"></i>{t('chat.conversations')}
            </h5>
            <span className="badge bg-primary rounded-pill">
              {conversations.length} {language === 'en' ? 'chats' : 'chats'}
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-grow-1 overflow-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                {language === 'en' ? 'No active conversations. Start chatting with your peers below.' : 'No tienes conversaciones activas. Inicia una con tus compañeros de estudio abajo.'}
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedPartner?.id === c.user.id;
                return (
                  <div
                    key={c.user.id}
                    className={`p-3 border-bottom d-flex align-items-center gap-3 ${isSelected ? 'bg-primary-subtle' : 'hover-bg'}`}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onClick={() => openChat(c.user.id)}
                  >
                    <div className="fb-avatar-wrap" style={{ width: 44, height: 44 }}>
                      <img
                        src={c.user.avatar_url || '/assets/camila_avatar.jpg'}
                        alt=""
                        className="fb-contact-avatar"
                        style={{ width: 44, height: 44 }}
                      />
                      <span className={`fb-status-dot ${c.user.is_online === 1 ? 'online' : 'offline'}`} style={{ width: 12, height: 12 }} title={c.user.is_online === 1 ? t('chat.activeNow') : t('chat.offline')}></span>
                    </div>

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold small text-dark text-truncate">{c.user.full_name}</span>
                        {c.unread_count > 0 && (
                          <span className="badge bg-danger rounded-pill px-2">{c.unread_count}</span>
                        )}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>
                        {c.last_message ? c.last_message.message : c.user.program}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick start chat with friends */}
            <div className="p-3 border-top bg-light">
              <div className="small fw-bold text-muted mb-2 text-uppercase" style={{ fontSize: '0.72rem' }}>
                {language === 'en' ? 'Connected Peers:' : 'Compañeros Conectados:'}
              </div>
              <div className="d-flex gap-2 overflow-auto py-1">
                {allFriends.map((f) => (
                  <button
                    key={f.id}
                    className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1 text-nowrap"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => openChat(f.id)}
                  >
                    <img src={f.avatar_url || '/assets/camila_avatar.jpg'} className="rounded-circle" style={{ width: 18, height: 18 }} />
                    {f.full_name ? f.full_name.split(' ')[0] : 'Amigo'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        <div className="flex-grow-1 d-flex flex-column bg-light">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-3 bg-white border-bottom d-flex align-items-center justify-content-between shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="fb-avatar-wrap" style={{ width: 44, height: 44 }}>
                    <img
                      src={selectedPartner.avatar_url || '/assets/camila_avatar.jpg'}
                      alt=""
                      className="fb-contact-avatar"
                      style={{ width: 44, height: 44 }}
                    />
                    <span
                      className={`fb-status-dot ${selectedPartner.is_online === 1 ? 'online' : 'offline'}`}
                      style={{ width: 12, height: 12 }}
                      title={selectedPartner.is_online === 1 ? t('chat.activeNow') : t('chat.offline')}
                    />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{selectedPartner.full_name}</h6>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      {selectedPartner.occupation || (language === 'en' ? 'SENA Apprentice' : 'Aprendiz SENA')} ·
                      {selectedPartner.is_online === 1
                        ? <span className="text-success fw-semibold ms-1">🟢 {t('chat.activeNow')}</span>
                        : <span className="text-muted ms-1">⚪ {t('chat.offline')}</span>
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill"
                    onClick={() => alert(`${selectedPartner.full_name} - ${selectedPartner.program}`)}
                  >
                    <i className="bi bi-info-circle me-1"></i> {language === 'en' ? 'Profile Info' : 'Ver Datos'}
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-grow-1 p-4 overflow-auto d-flex flex-column gap-3" style={{ backgroundColor: '#f0f2f5' }}>
                <div className="text-center my-2">
                  <span className="badge bg-secondary-subtle text-secondary px-3 py-1 rounded-pill small">
                    {language === 'en' ? `Direct chat with ${selectedPartner.full_name}` : `Inicio de la conversación institucional con ${selectedPartner.full_name}`}
                  </span>
                </div>

                {messages.map((m) => {
                  const isMe = m.sender_id === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      {!isMe && (
                        <img
                          src={selectedPartner.avatar_url || '/assets/camila_avatar.jpg'}
                          alt=""
                          className="rounded-circle me-2 align-self-end"
                          style={{ width: 30, height: 30, objectFit: 'cover' }}
                        />
                      )}
                      <div
                        className="p-3 shadow-sm"
                        style={{
                          maxWidth: '68%',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isMe ? 'var(--sena-blue)' : '#ffffff',
                          color: isMe ? '#ffffff' : '#1c1e21',
                          fontSize: '0.92rem',
                          lineHeight: '1.45'
                        }}
                      >
                        <div>{m.message}</div>
                        <div
                          className="text-end"
                          style={{
                            fontSize: '0.7rem',
                            marginTop: '4px',
                            color: isMe ? 'rgba(255,255,255,0.75)' : '#8c939d'
                          }}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <i className="bi bi-check2-all ms-1"></i>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-top d-flex gap-2 align-items-center">
                <input
                  type="text"
                  className="form-control rounded-pill bg-light border-0 px-4 py-2"
                  placeholder={`${t('chat.typeMessage')} (${selectedPartner?.full_name ? selectedPartner.full_name.split(' ')[0] : ''})...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="sena-btn-primary rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: 44, height: 44, minWidth: 44 }}
                  disabled={sending || !newMessage.trim()}
                  title={t('chat.send')}
                >
                  <i className="bi bi-send-fill fs-5"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-muted">
              <i className="bi bi-chat-heart fs-1 mb-2 text-primary"></i>
              <h5>{t('chat.selectChatPrompt')}</h5>
              <p className="small">{language === 'en' ? 'Collaborate and interact with fellow SENA apprentices.' : 'Interactúa y coordina proyectos con tus compañeros aprendices.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
