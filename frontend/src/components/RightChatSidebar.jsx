import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RightChatSidebar({ onOpenMiniChat, onViewFullMessages }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 15000); // Auto-refresh status
    return () => clearInterval(interval);
  }, [currentUser]);

  async function loadContacts() {
    try {
      const users = await api.getUsers();
      // Filter out current user
      const filtered = users.filter(u => u.id !== currentUser?.id);
      setContacts(filtered);
    } catch (e) {
      console.warn('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredContacts = contacts.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.program?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = contacts.filter(c => c.is_online === 1).length;

  return (
    <aside className="fb-right-sidebar">
      {/* Sidebar Header */}
      <div className="fb-right-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fb-right-title">{t('chat.contactsTitle')}</span>
            <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.72rem' }}>
              <span className="status-dot-mini me-1"></span>
              {t('chat.activeCount', { count: onlineCount })}
            </span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button
              className="fb-icon-action"
              title={t('chat.openFullMessenger')}
              onClick={onViewFullMessages}
            >
              <i className="bi bi-arrows-fullscreen"></i>
            </button>
            <button
              className="fb-icon-action"
              title={t('chat.refresh')}
              onClick={loadContacts}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="fb-contacts-search mt-2">
          <i className="bi bi-search fb-search-icon"></i>
          <input
            type="text"
            className="fb-search-input"
            placeholder={t('chat.searchContacts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="fb-contacts-scroll">
        {loading ? (
          <div className="p-3 text-center text-muted small">
            <div className="spinner-border spinner-border-sm text-secondary me-2"></div>
            {language === 'en' ? 'Loading contacts...' : 'Cargando contactos...'}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            {language === 'en' ? 'No contacts found.' : 'No se encontraron contactos.'}
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isOnline = contact.is_online === 1;
            return (
              <div
                key={contact.id}
                className="fb-contact-item"
                onClick={() => onOpenMiniChat && onOpenMiniChat(contact)}
                title={`${contact.full_name} (${isOnline ? t('chat.activeNow') : t('chat.offline')})`}
              >
                {/* Avatar with REAL status dot */}
                <div className="fb-avatar-wrap">
                  <img
                    src={contact.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                    alt={contact.full_name}
                    className="fb-contact-avatar"
                  />
                  <span
                    className={`fb-status-dot ${isOnline ? 'online' : 'offline'}`}
                    title={isOnline ? t('chat.activeNow') : t('chat.offline')}
                  />
                </div>

                {/* Contact info */}
                <div className="fb-contact-info">
                  <div className="fb-contact-name">
                    {contact.full_name}
                  </div>
                  <div className="fb-contact-sub">
                    {isOnline ? (
                      <span className="text-success fw-medium">{t('chat.activeNow')}</span>
                    ) : (
                      <span className="text-muted">{contact.occupation || (language === 'en' ? 'SENA Apprentice' : 'Aprendiz SENA')}</span>
                    )}
                  </div>
                </div>

                {/* Chat bubble icon on hover */}
                <div className="fb-chat-hint">
                  <i className="bi bi-chat-fill"></i>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Shortcuts / Full Messenger link */}
      <div className="fb-right-footer">
        <button
          className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={onViewFullMessages}
          style={{ borderRadius: 8, fontSize: '0.82rem' }}
        >
          <i className="bi bi-chat-dots"></i>
          <span>{t('chat.openFullMessenger')}</span>
        </button>
      </div>
    </aside>
  );
}
