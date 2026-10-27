import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ onSearch, setCurrentView }) {
  const { currentUser, logout, switchDemoUser, loginAsAdmin, setAuthModalOpen, setAuthMode } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await api.getNotifications();
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.warn('Could not load notifications:', e);
    }
  }

  async function handleToggleNotifications() {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await api.markNotificationsRead();
        setUnreadCount(0);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  }

  return (
    <header className="sena-topbar">
      {/* Search Bar - Modern Facebook pill style */}
      <form className="topbar-search-box" onSubmit={handleSearchSubmit}>
        <i className="bi bi-search topbar-search-icon"></i>
        <input
          type="text"
          className="topbar-search-input"
          placeholder={t('nav.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
        />
      </form>

      {/* Center Status / Active User Info */}
      <div className="d-none d-xl-flex align-items-center ms-3 me-auto">
        {currentUser ? (
          <div className="fb-session-pill">
            <span className="fb-pulse-green"></span>
            <span className="small text-muted">{t('nav.activeSession')}</span>
            <strong className="text-dark small ms-1">{currentUser.full_name}</strong>
            <span className="badge bg-success-subtle text-success border border-success-subtle ms-1" style={{ fontSize: '0.68rem' }}>
              {currentUser.ficha || 'SENA'}
            </span>
          </div>
        ) : (
          <div className="fb-guest-pill">
            <i className="bi bi-info-circle text-secondary me-1"></i>
            <span className="small text-muted">{t('nav.guestMode')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="topbar-actions d-flex align-items-center">
        {/* Prominent Language Switcher (🇺🇸 EN / 🇪🇸 ES) */}
        <LanguageSwitcher />

        {currentUser ? (
          <>
            {/* Quick Admin Panel Button */}
            {(currentUser.role === 'superadmin' || currentUser.role === 'admin') && (
              <button
                type="button"
                className="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark d-flex align-items-center gap-1 shadow-sm ms-2"
                onClick={() => setCurrentView('admin')}
                title="Abrir Panel de Administración SENA"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span className="d-none d-md-inline">Panel Admin</span>
              </button>
            )}

            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="topbar-icon-btn"
                title={t('nav.notifications')}
                onClick={handleToggleNotifications}
              >
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && (
                  <span className="topbar-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="sena-dropdown" style={{ width: '360px' }}>
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">
                      <i className="bi bi-bell me-2 text-primary"></i>{t('nav.notifications')}
                    </span>
                    <span className="badge bg-primary rounded-pill">
                      {notifications.length}
                    </span>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted small">
                        <i className="bi bi-check2-circle fs-3 d-block mb-1 text-success"></i>
                        {t('nav.noNotifications')}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 border-bottom d-flex gap-3 align-items-start hover-bg"
                          style={{
                            backgroundColor: n.is_read ? '#ffffff' : '#f0f7ff',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setShowNotifications(false);
                            setCurrentView('inicio');
                          }}
                        >
                          <img
                            src={n.sender_avatar || '/assets/camila_avatar.jpg'}
                            alt=""
                            className="rounded-circle"
                            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                          />
                          <div className="flex-grow-1">
                            <div className="small text-dark">{n.text}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                              {t('nav.recentNotification')}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Menu */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                className="topbar-avatar-btn d-flex align-items-center gap-2 px-2 py-1"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={t('nav.accountMenu')}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={currentUser.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                    alt={currentUser.full_name}
                    className="topbar-avatar-img"
                  />
                  <span className="fb-status-dot online" style={{ width: 10, height: 10, bottom: 0, right: 0 }} />
                </div>
                <span className="d-none d-md-inline small fw-semibold text-dark text-truncate" style={{ maxWidth: 120 }}>
                  {currentUser.full_name?.split(' ')[0]}
                </span>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.75rem' }}></i>
              </button>

              {showUserMenu && (
                <div className="sena-dropdown" style={{ width: '280px' }}>
                  <div className="p-3 border-bottom bg-light">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <img
                        src={currentUser.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                        alt=""
                        className="rounded-circle"
                        style={{ width: 38, height: 38, objectFit: 'cover' }}
                      />
                      <div className="overflow-hidden">
                        <div className="fw-bold text-dark text-truncate">{currentUser.full_name}</div>
                        <div className="text-muted small text-truncate">@{currentUser.username}</div>
                      </div>
                    </div>
                    <div className="d-flex gap-1 mt-2 flex-wrap">
                      <span className="badge bg-success text-white small">
                        <i className="bi bi-check-circle-fill me-1"></i>{t('nav.activeAccount')}
                      </span>
                      <span className="badge bg-light text-dark border small">
                        {currentUser.ficha || 'SENA'}
                      </span>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                      onClick={() => {
                        setCurrentView('perfil');
                        setShowUserMenu(false);
                      }}
                    >
                      <i className="bi bi-person text-success"></i> {t('nav.profile')}
                    </button>
                    <button
                      className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                      onClick={() => {
                        setCurrentView('configuracion');
                        setShowUserMenu(false);
                      }}
                    >
                      <i className="bi bi-gear text-secondary"></i> {t('nav.settings')}
                    </button>

                    {(currentUser.role === 'superadmin' || currentUser.role === 'admin') && (
                      <button
                        className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 fw-semibold text-warning-emphasis"
                        onClick={() => {
                          setCurrentView('admin');
                          setShowUserMenu(false);
                        }}
                      >
                        <i className="bi bi-shield-lock-fill text-warning"></i> {t('nav.admin')}
                      </button>
                    )}

                    <div className="dropdown-divider my-2"></div>

                    <div className="px-3 py-1 text-muted fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      {t('nav.switchDemo')}
                    </div>
                    <button
                      className={`dropdown-item py-2 px-3 small d-flex align-items-center justify-content-between ${currentUser?.username === 'juanpato27' ? 'fw-bold bg-light' : ''}`}
                      onClick={() => {
                        switchDemoUser('juanpato27');
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/juan_pablo_avatar.jpg" className="rounded-circle" style={{ width: 22, height: 22, objectFit: 'cover' }} />
                        <span>Juan Pablo Tocarema (ADSO)</span>
                      </div>
                      {currentUser?.username === 'juanpato27' && <i className="bi bi-check2 text-success fw-bold"></i>}
                    </button>
                    <button
                      className={`dropdown-item py-2 px-3 small d-flex align-items-center justify-content-between ${currentUser?.username === 'camilarodz' ? 'fw-bold bg-light' : ''}`}
                      onClick={() => {
                        switchDemoUser('camilarodz');
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/camila_avatar.jpg" className="rounded-circle" style={{ width: 22, height: 22, objectFit: 'cover' }} />
                        <span>Camila Rodríguez (Redes)</span>
                      </div>
                      {currentUser?.username === 'camilarodz' && <i className="bi bi-check2 text-success fw-bold"></i>}
                    </button>
                    <button
                      className={`dropdown-item py-2 px-3 small d-flex align-items-center justify-content-between ${currentUser?.username === 'carlos_mendoza' ? 'fw-bold bg-light' : ''}`}
                      onClick={() => {
                        switchDemoUser('carlos_mendoza');
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" className="rounded-circle" style={{ width: 22, height: 22, objectFit: 'cover' }} />
                        <span>Carlos Andrés Mendoza (Animación 3D)</span>
                      </div>
                      {currentUser?.username === 'carlos_mendoza' && <i className="bi bi-check2 text-success fw-bold"></i>}
                    </button>
                    <button
                      className={`dropdown-item py-2 px-3 small d-flex align-items-center justify-content-between ${currentUser?.username === 'admin' ? 'fw-bold bg-light' : ''}`}
                      onClick={() => {
                        switchDemoUser('admin');
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, fontSize: '0.7rem' }}>
                          <i className="bi bi-shield-fill"></i>
                        </div>
                        <span>Administrador SENA (Superadmin)</span>
                      </div>
                      {currentUser?.username === 'admin' && <i className="bi bi-check2 text-warning fw-bold"></i>}
                    </button>

                    <div className="dropdown-divider my-2"></div>

                    <button
                      className="dropdown-item py-2 px-3 text-danger d-flex align-items-center gap-2 fw-medium"
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                    >
                      <i className="bi bi-box-arrow-left"></i> {t('nav.logOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* GUEST STATE - Clear buttons to sign in or register */
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-warning btn-sm px-3 rounded-pill fw-bold text-dark shadow-sm border"
              title="Iniciar como Administrador de inmediato"
              onClick={() => loginAsAdmin()}
            >
              <i className="bi bi-shield-fill-check me-1"></i> Admin (Superadmin)
            </button>
            <button
              className="btn btn-outline-success btn-sm px-3 rounded-pill fw-semibold"
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> {t('nav.signIn')}
            </button>
            <button
              className="btn btn-success btn-sm px-3 rounded-pill fw-semibold text-white shadow-sm"
              onClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
            >
              <i className="bi bi-person-plus-fill me-1"></i> {t('nav.createAccount')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
