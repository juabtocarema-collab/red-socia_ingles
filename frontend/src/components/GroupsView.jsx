import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function GroupsView() {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Training Programs');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('/assets/sena_campus_cover.jpg');
  const [avatarImage, setAvatarImage] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80');

  // Group post
  const [groupPostContent, setGroupPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenGroup(groupId) {
    try {
      const groupData = await api.getGroupById(groupId);
      setSelectedGroup(groupData);
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error loading group' : 'Error al cargar grupo'));
    }
  }

  async function handleJoinGroup(groupId) {
    try {
      await api.joinGroup(groupId);
      loadGroups();
      if (selectedGroup && selectedGroup.id === groupId) {
        handleOpenGroup(groupId);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleLeaveGroup(groupId) {
    try {
      await api.leaveGroup(groupId);
      loadGroups();
      if (selectedGroup && selectedGroup.id === groupId) {
        handleOpenGroup(groupId);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleCreateGroupSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await api.createGroup({
        name,
        category,
        description,
        cover_image: coverImage,
        avatar_image: avatarImage
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      loadGroups();
      handleOpenGroup(res.id);
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error creating group' : 'Error al crear grupo'));
    }
  }

  async function handleCreateGroupPost(e) {
    e.preventDefault();
    if (!groupPostContent.trim() || !selectedGroup) return;

    setSubmittingPost(true);
    try {
      const newPost = await api.createPost({
        content: groupPostContent,
        group_id: selectedGroup.id
      });
      setSelectedGroup({
        ...selectedGroup,
        posts: [newPost, ...(selectedGroup.posts || [])]
      });
      setGroupPostContent('');
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error posting in group' : 'Error al publicar en grupo'));
    } finally {
      setSubmittingPost(false);
    }
  }

  const categories = language === 'en'
    ? ['All', 'Training Programs', 'Fichas', 'Technology', 'Research Seeds']
    : ['Todos', 'Programas de Formación', 'Fichas', 'Tecnología', 'Semilleros'];

  const filteredGroups = selectedCategory === 'All' || selectedCategory === 'Todos'
    ? groups
    : groups.filter(g => g.category?.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="content-wrapper">
      {/* Top Banner */}
      <div className="sena-card mb-4" style={{ background: 'linear-gradient(135deg, #074C83 0%, #053b66 100%)', color: 'white' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1"><i className="bi bi-collection-fill me-2"></i>{t('groups.title')}</h3>
            <p className="mb-0 text-light opacity-75">
              {t('groups.subtitle')}
            </p>
          </div>
          <button
            className="btn btn-light fw-bold text-primary shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle-fill me-2"></i>{t('groups.createGroupBtn')}
          </button>
        </div>
      </div>

      {selectedGroup ? (
        /* DETAIL VIEW OF SELECTED GROUP */
        <div>
          <button
            className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-2"
            onClick={() => setSelectedGroup(null)}
          >
            <i className="bi bi-arrow-left"></i> {language === 'en' ? 'Back to all groups' : 'Volver a todos los grupos'}
          </button>

          {/* Group Header Card */}
          <div className="sena-card p-0 overflow-hidden mb-4">
            <div style={{ height: '180px', overflow: 'hidden', background: '#334155' }}>
              <img
                src={selectedGroup.cover_image || '/assets/sena_campus_cover.jpg'}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="p-4 d-flex align-items-end justify-content-between flex-wrap gap-3" style={{ marginTop: '-45px' }}>
              <div className="d-flex align-items-end gap-3">
                <img
                  src={selectedGroup.avatar_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80'}
                  alt=""
                  className="rounded-4 border border-4 border-white shadow"
                  style={{ width: 90, height: 90, objectFit: 'cover', background: 'white' }}
                />
                <div>
                  <span className="badge bg-primary mb-1">{selectedGroup.category}</span>
                  <h3 className="fw-bold mb-0 text-dark">{selectedGroup.name}</h3>
                  <div className="text-muted small">
                    {t('groups.membersCount', { count: selectedGroup.members_count || 1 })} · {language === 'en' ? 'Created by' : 'Creado por'} {selectedGroup.creator_name}
                  </div>
                </div>
              </div>

              <div>
                {selectedGroup.is_member > 0 ? (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleLeaveGroup(selectedGroup.id)}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i> {t('groups.leaveBtn')}
                  </button>
                ) : (
                  <button
                    className="sena-btn-primary"
                    onClick={() => handleJoinGroup(selectedGroup.id)}
                  >
                    <i className="bi bi-person-plus-fill me-1"></i> {t('groups.joinBtn')}
                  </button>
                )}
              </div>
            </div>
            <div className="px-4 pb-3 text-secondary small">
              {selectedGroup.description || (language === 'en' ? 'No description available.' : 'Sin descripción.')}
            </div>
          </div>

          {/* Group Content Grid */}
          <div className="row g-4">
            {/* Feed inside Group */}
            <div className="col-lg-8">
              {/* Post Creator inside group */}
              <div className="post-creator-card mb-4">
                <form onSubmit={handleCreateGroupPost}>
                  <div className="fw-bold small text-muted mb-2">
                    <i className="bi bi-chat-left-dots text-primary me-2"></i>
                    {language === 'en' ? `Post in ${selectedGroup.name}` : `Publicar en ${selectedGroup.name}`}
                  </div>
                  <textarea
                    className="post-creator-textarea"
                    placeholder={language === 'en' ? 'Share study guides, technical questions or announcements...' : 'Comparte dudas técnicas, guías de aprendizaje o anuncios con los miembros...'}
                    value={groupPostContent}
                    onChange={(e) => setGroupPostContent(e.target.value)}
                  />
                  <div className="d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="sena-btn-primary btn-sm"
                      disabled={submittingPost || !groupPostContent.trim()}
                    >
                      {submittingPost ? t('feed.publishing') : (language === 'en' ? 'Post in group' : 'Publicar en grupo')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Group Posts */}
              {selectedGroup.posts && selectedGroup.posts.length > 0 ? (
                selectedGroup.posts.map((p) => (
                  <div key={p.id} className="post-card mb-3">
                    <div className="post-header">
                      <img src={p.avatar_url || '/assets/juan_pablo_avatar.jpg'} className="post-author-avatar" />
                      <div>
                        <div className="post-author-name">{p.full_name}</div>
                        <div className="post-meta-sub">{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="post-content">{p.content}</div>
                  </div>
                ))
              ) : (
                <div className="sena-card text-center py-4 text-muted">
                  <i className="bi bi-chat-square-text fs-2 d-block mb-2"></i>
                  {language === 'en' ? 'No posts in this group yet. Be the first!' : 'Aún no hay publicaciones en este grupo. ¡Sé el primero!'}
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="col-lg-4">
              <div className="sena-card">
                <h6 className="sena-card-title mb-3">
                  <i className="bi bi-people-fill text-primary me-2"></i>
                  {language === 'en' ? `Group Members (${selectedGroup.members?.length || 0})` : `Miembros del Grupo (${selectedGroup.members?.length || 0})`}
                </h6>
                <div className="d-flex flex-column gap-3">
                  {selectedGroup.members?.map((m) => (
                    <div key={m.id} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <img src={m.avatar_url || '/assets/juan_pablo_avatar.jpg'} className="rounded-circle" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                        <div>
                          <div className="fw-bold small text-dark">{m.full_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{m.program || (language === 'en' ? 'Apprentice' : 'Aprendiz')}</div>
                        </div>
                      </div>
                      <span className={`badge ${m.role === 'admin' ? 'bg-primary' : 'bg-light text-dark'}`}>
                        {m.role === 'admin' ? (language === 'en' ? 'Admin' : 'Administrador') : (language === 'en' ? 'Member' : 'Miembro')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIST OF ALL GROUPS */
        <div>
          {/* Categories Pill Bar */}
          <div className="sena-card p-3 mb-4">
            <div className="d-flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm rounded-pill fw-bold px-3 ${selectedCategory === cat ? 'btn-primary' : 'btn-light text-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div className="row g-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="col-md-6 col-lg-4">
                  <div className="sena-card h-100 p-0 overflow-hidden d-flex flex-column">
                    <div style={{ height: 130, position: 'relative' }}>
                      <img src={group.cover_image || '/assets/sena_campus_cover.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="badge bg-dark bg-opacity-75 position-absolute top-0 end-0 m-2">
                        {group.category}
                      </span>
                    </div>

                    <div className="p-3 flex-grow-1 d-flex flex-column">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <img
                          src={group.avatar_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80'}
                          className="rounded-3 shadow-sm"
                          style={{ width: 44, height: 44, objectFit: 'cover', marginTop: -32, border: '3px solid white', background: 'white' }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-0 text-dark">{group.name}</h6>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {t('groups.membersCount', { count: group.members_count || 1 })}
                          </div>
                        </div>
                      </div>

                      <p className="text-secondary small mb-3 flex-grow-1" style={{ fontSize: '0.84rem' }}>
                        {group.description?.slice(0, 100) || (language === 'en' ? 'SENA Learning Community.' : 'Comunidad formativa SENA.')}...
                      </p>

                      <div className="d-flex gap-2 mt-auto">
                        <button
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          onClick={() => handleOpenGroup(group.id)}
                        >
                          {language === 'en' ? 'View Group' : 'Ver Grupo'}
                        </button>
                        {group.is_member > 0 ? (
                          <button
                            className="btn btn-light btn-sm text-success fw-bold"
                            onClick={() => handleLeaveGroup(group.id)}
                            title={language === 'en' ? 'You are a member' : 'Ya eres miembro'}
                          >
                            <i className="bi bi-check-lg"></i> {t('groups.joinedBtn')}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleJoinGroup(group.id)}
                          >
                            <i className="bi bi-plus-lg"></i> {t('groups.joinBtn')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR GRUPO */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-plus-circle me-2 text-primary"></i>
                  {language === 'en' ? 'Create Institutional SENA Group' : 'Crear Grupo Institucional SENA'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateGroupSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">{t('groups.newGroupName')}:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ADSO - Class 2670142"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{t('groups.newGroupCategory')}:</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Programas de Formación">{language === 'en' ? 'Training Programs' : 'Programas de Formación'}</option>
                      <option value="Fichas">{language === 'en' ? 'Fichas / Classes' : 'Fichas'}</option>
                      <option value="Tecnología">{language === 'en' ? 'Technology & IT' : 'Tecnología e Informática'}</option>
                      <option value="Semilleros">{language === 'en' ? 'Research Seeds' : 'Semilleros de Investigación'}</option>
                      <option value="Deportes y Cultura">{language === 'en' ? 'Sports & Culture' : 'Deportes y Cultura'}</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{t('groups.newGroupDesc')}:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder={language === 'en' ? 'Describe the purpose and goals of this group...' : 'Indica el propósito del grupo, temario, ficha o jornada...'}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>{t('groups.cancel')}</button>
                  <button type="submit" className="sena-btn-primary">{t('groups.create')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
