import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function FriendsView({ onSelectUserChat, onViewProfile }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('mis-amigos'); // 'mis-amigos', 'explorar', 'solicitudes'
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  async function loadData() {
    setLoading(true);
    try {
      const [friendsList, usersList, reqList] = await Promise.all([
        api.getFriends(),
        api.getUsers(),
        api.getFriendRequests()
      ]);
      setFriends(friendsList || []);
      setAllUsers(usersList || []);
      setRequests(reqList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(targetId, targetName) {
    try {
      await api.addFriend(targetId);
      alert(language === 'en' ? `Added ${targetName} to your classmates network!` : `¡Agregaste a ${targetName} a tu red de aprendices!`);
      loadData();
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error adding friend' : 'Error al agregar amigo'));
    }
  }

  async function handleRemoveFriend(targetId) {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to remove this friend?' : '¿Seguro que deseas eliminar este compañero de tus amigos?')) return;
    try {
      await api.removeFriend(targetId);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  const filteredFriends = friends.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.program?.toLowerCase().includes(search.toLowerCase()) ||
    f.origin_city?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.id !== currentUser?.id &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.program?.toLowerCase().includes(search.toLowerCase()) ||
     u.origin_city?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="content-wrapper">
      {/* Top Banner */}
      <div className="sena-card mb-4" style={{ background: 'linear-gradient(135deg, #074C83 0%, #053b66 100%)', color: 'white' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1"><i className="bi bi-people-fill me-2"></i>{t('friends.title')}</h3>
            <p className="mb-0 text-light opacity-75">
              {t('friends.subtitle')}
            </p>
          </div>
          <div className="d-flex gap-2">
            <span className="badge bg-light text-primary fs-6 px-3 py-2 rounded-pill shadow-sm">
              <i className="bi bi-person-check-fill me-1"></i> {friends.length} {language === 'en' ? 'Connected Peers' : 'Amigos Conectados'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Header */}
      <div className="sena-card mb-4 p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <ul className="nav nav-pills gap-2 mb-0">
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 fw-bold ${activeTab === 'mis-amigos' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('mis-amigos')}
              >
                <i className="bi bi-people me-2"></i>{language === 'en' ? `My Friends (${friends.length})` : `Mis Amigos (${friends.length})`}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 fw-bold ${activeTab === 'explorar' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('explorar')}
              >
                <i className="bi bi-compass me-2"></i>{language === 'en' ? 'Explore Apprentices' : 'Explorar Aprendices'}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 fw-bold ${activeTab === 'solicitudes' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('solicitudes')}
              >
                <i className="bi bi-person-plus me-2"></i>{language === 'en' ? `Requests (${requests.length})` : `Solicitudes (${requests.length})`}
              </button>
            </li>
          </ul>

          <div className="topbar-search-box" style={{ width: 280 }}>
            <i className="bi bi-search topbar-search-icon"></i>
            <input
              type="text"
              className="topbar-search-input"
              placeholder={t('friends.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-2 text-muted small">{language === 'en' ? 'Loading peers...' : 'Cargando compañeros...'}</div>
        </div>
      ) : activeTab === 'mis-amigos' ? (
        filteredFriends.length === 0 ? (
          <div className="sena-card text-center py-5">
            <i className="bi bi-people fs-1 text-muted d-block mb-3"></i>
            <h5>{language === 'en' ? 'No friends added yet' : 'Aún no tienes amigos agregados'}</h5>
            <p className="text-muted">
              {language === 'en' ? 'Go to the "Explore Apprentices" tab to meet your SENA peers.' : 'Ve a la pestaña "Explorar Aprendices" para conocer a tus compañeros del SENA.'}
            </p>
            <button className="btn btn-primary" onClick={() => setActiveTab('explorar')}>
              {language === 'en' ? 'Explore Apprentices' : 'Explorar Aprendices'}
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="col-md-6 col-lg-4">
                <div className="sena-card h-100 text-center p-4 d-flex flex-column align-items-center">
                  <div className="fb-avatar-wrap mx-auto mb-3" style={{ width: 88, height: 88 }}>
                    <img
                      src={friend.avatar_url || '/assets/camila_avatar.jpg'}
                      alt={friend.full_name}
                      className="fb-contact-avatar shadow-sm"
                      style={{ width: 88, height: 88 }}
                    />
                    <span
                      className={`fb-status-dot ${friend.is_online === 1 ? 'online' : 'offline'}`}
                      style={{ width: 14, height: 14 }}
                      title={friend.is_online === 1 ? t('chat.activeNow') : t('chat.offline')}
                    />
                  </div>

                  <h5 className="fw-bold mb-1 text-dark">{friend.full_name}</h5>
                  <div className="text-muted small mb-1">@{friend.username}</div>
                  <div className="small mb-2">
                    {friend.is_online === 1
                      ? <span className="text-success fw-semibold">🟢 {t('chat.activeNow')}</span>
                      : <span className="text-muted">⚪ {t('chat.offline')}</span>
                    }
                  </div>

                  <div className="badge bg-primary-subtle text-primary border small mb-2 text-wrap">
                    {friend.program || 'Aprendiz SENA'}
                  </div>

                  <div className="text-muted small mb-3">
                    <i className="bi bi-geo-alt me-1 text-danger"></i>{friend.origin_city || 'Colombia'}
                  </div>

                  <div className="d-flex gap-2 mt-auto w-100 justify-content-center">
                    <button
                      className="btn btn-outline-primary btn-sm flex-grow-1"
                      onClick={() => onSelectUserChat && onSelectUserChat(friend.id)}
                    >
                      <i className="bi bi-chat-dots-fill me-1"></i> {t('friends.messageBtn')}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      title={language === 'en' ? 'Remove friend' : 'Eliminar amigo'}
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      <i className="bi bi-person-x-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'explorar' ? (
        <div className="row g-4">
          {filteredUsers.map((user) => {
            const isAlreadyFriend = friends.some(f => f.id === user.id);
            return (
              <div key={user.id} className="col-md-6 col-lg-4">
                <div className="sena-card h-100 text-center p-4 d-flex flex-column align-items-center">
                  <img
                    src={user.avatar_url || '/assets/camila_avatar.jpg'}
                    alt={user.full_name}
                    className="rounded-circle shadow-sm mb-3"
                    style={{ width: 88, height: 88, objectFit: 'cover' }}
                  />

                  <h5 className="fw-bold mb-1 text-dark">{user.full_name}</h5>
                  <div className="text-muted small mb-2">@{user.username}</div>

                  <div className="badge bg-secondary-subtle text-secondary border small mb-2 text-wrap">
                    {user.program || 'Aprendiz SENA'}
                  </div>

                  <div className="text-muted small mb-3">
                    <i className="bi bi-geo-alt me-1 text-danger"></i>{user.origin_city || 'Colombia'}
                  </div>

                  <div className="mt-auto w-100">
                    {isAlreadyFriend ? (
                      <button
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => onSelectUserChat && onSelectUserChat(user.id)}
                      >
                        <i className="bi bi-check2-circle me-1"></i> {language === 'en' ? 'Already connected · Chat' : 'Ya son amigos · Chatear'}
                      </button>
                    ) : (
                      <button
                        className="sena-btn-primary btn-sm w-100"
                        onClick={() => handleAddFriend(user.id, user.full_name)}
                      >
                        <i className="bi bi-person-plus-fill me-1"></i> {t('friends.addFriendBtn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Solicitudes */
        <div className="sena-card p-4">
          <h5 className="fw-bold mb-3"><i className="bi bi-bell-fill text-warning me-2"></i>{language === 'en' ? 'Pending Friend Requests' : 'Solicitudes de amistad pendientes'}</h5>
          {requests.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              {language === 'en' ? 'No pending requests at this moment.' : 'No tienes solicitudes pendientes en este momento.'}
            </div>
          ) : (
            <div className="list-group">
              {requests.map(r => (
                <div key={r.request_id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <img src={r.avatar_url || '/assets/camila_avatar.jpg'} className="rounded-circle" style={{ width: 44, height: 44 }} />
                    <div>
                      <div className="fw-bold text-dark">{r.full_name}</div>
                      <div className="small text-muted">{r.program} · {r.ficha}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={() => handleAddFriend(r.user_id, r.full_name)}>
                      {language === 'en' ? 'Accept' : 'Aceptar'}
                    </button>
                    <button className="btn btn-light btn-sm">
                      {language === 'en' ? 'Decline' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
