import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar({ currentView, setCurrentView, unreadMessagesCount = 2 }) {
  const { currentUser, loginAsAdmin, setAuthModalOpen, setAuthMode } = useAuth();
  const { t } = useLanguage();

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const navItems = [
    { id: 'inicio', label: t('nav.feed'), icon: 'bi-house-door-fill' },
    { id: 'perfil', label: t('nav.profile'), icon: 'bi-person-fill' },
    ...(isAdmin ? [{ id: 'admin', label: t('nav.admin'), icon: 'bi-shield-check-fill', isAdminItem: true }] : []),
    { id: 'amigos', label: t('nav.friends'), icon: 'bi-people-fill' },
    { id: 'grupos', label: t('nav.groups'), icon: 'bi-collection-fill' },
    { id: 'mensajes', label: t('nav.messages'), icon: 'bi-chat-dots-fill', badge: unreadMessagesCount },
    { id: 'eventos', label: t('nav.events'), icon: 'bi-calendar-event-fill' },
    { id: 'configuracion', label: t('nav.settings'), icon: 'bi-gear-fill' },
  ];

  return (
    <aside className="sena-sidebar">
      {/* Brand & Logo */}
      <div className="sena-sidebar-brand text-start px-3 py-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <img
            src="/assets/sena_logo.svg"
            alt="SENA Logo"
            className="sena-logo-img"
            style={{ width: 38, height: 38 }}
          />
          <div>
            <h5 className="sena-brand-title mb-0" style={{ fontSize: '1.05rem' }}>{t('nav.brandTitle')}</h5>
            <div className="sena-brand-sub" style={{ fontSize: '0.68rem' }}>{t('nav.brandSubtitle')}</div>
          </div>
        </div>

        {/* User Card inside Sidebar */}
        {currentUser ? (
          <div
            className="p-2 rounded mt-2 d-flex align-items-center gap-2"
            style={{ background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
            onClick={() => setCurrentView('perfil')}
            title={t('nav.profile')}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={currentUser.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                alt=""
                className="rounded-circle"
                style={{ width: 34, height: 34, objectFit: 'cover' }}
              />
              <span className="fb-status-dot online" style={{ width: 8, height: 8 }} />
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-white small text-truncate" style={{ fontSize: '0.82rem' }}>
                {currentUser.full_name}
              </div>
              <div className="text-light opacity-75 text-truncate" style={{ fontSize: '0.7rem' }}>
                🟢 {t('nav.onlineStatus')} · {currentUser.ficha || 'SENA'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded mt-2 bg-dark bg-opacity-25 text-center">
            <div className="text-light small mb-1" style={{ fontSize: '0.75rem' }}>{t('nav.guestMode')}</div>
            <button
              className="btn btn-sm btn-warning w-100 py-1 mb-1 fw-bold text-dark shadow-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() => loginAsAdmin()}
            >
              <i className="bi bi-shield-fill-check me-1"></i> Iniciar como Admin
            </button>
            <button
              className="btn btn-sm btn-success w-100 py-1 fw-bold text-white"
              style={{ fontSize: '0.75rem' }}
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            >
              {t('nav.signIn')}
            </button>
          </div>
        )}

        {/* Sidebar Language Selector */}
        <LanguageSwitcher variant="sidebar" />
      </div>

      {/* Navigation Menu */}
      <nav className="sena-nav">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`sena-nav-item ${isActive ? 'active' : ''} ${item.isAdminItem ? 'border border-warning border-opacity-25' : ''}`}
              onClick={() => setCurrentView(item.id)}
              style={item.isAdminItem && !isActive ? { color: '#ffda6a' } : {}}
            >
              <i className={`bi ${item.icon} ${item.isAdminItem ? 'text-warning' : ''}`}></i>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="sena-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Slogan & Institutional Footer */}
      <div className="sena-sidebar-footer py-2 px-3 border-top border-white border-opacity-10">
        <div className="small text-white opacity-75 text-center" style={{ fontSize: '0.72rem' }}>
          {t('nav.institutionalFooter')}
        </div>
      </div>
    </aside>
  );
}
