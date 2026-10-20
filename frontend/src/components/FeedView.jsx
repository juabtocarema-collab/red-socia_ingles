import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function FeedView({ setCurrentView }) {
  const { currentUser, setAuthModalOpen, setAuthMode } = useAuth();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (e) {
      console.error('Error loading posts:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!currentUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (!newContent.trim() && !newImage.trim()) return;

    setSubmitting(true);
    try {
      const post = await api.createPost({
        content: newContent,
        image_url: newImage || null
      });
      setPosts([post, ...posts]);
      setNewContent('');
      setNewImage('');
      setShowImageInput(false);
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error publishing post' : 'Error al publicar'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReact(postId, reactionType = 'like') {
    if (!currentUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await api.reactToPost(postId, reactionType);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, likes_count: res.likes_count, user_reaction: res.user_reaction };
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddComment(postId) {
    if (!currentUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const newComment = await api.addComment(postId, text);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: (p.comments_count || 0) + 1,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error adding comment' : 'Error al comentar'));
    }
  }

  const avatar = currentUser?.avatar_url || '/assets/juan_pablo_avatar.jpg';

  return (
    <div className="fb-feed-container mx-auto" style={{ maxWidth: '680px' }}>
      {/* Facebook-style Post Creator Box */}
      <div className="post-creator-card mb-3">
        <form onSubmit={handleCreatePost}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <img
              src={avatar}
              alt=""
              className="rounded-circle"
              style={{ width: 40, height: 40, objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control rounded-pill bg-light border-0 px-3 py-2"
                placeholder={
                  currentUser
                    ? t('feed.whatsOnYourMind', { name: currentUser.full_name?.split(' ')[0] || '' })
                    : (language === 'en' ? 'Sign in to post on the SENA feed...' : 'Inicia sesión para publicar en el muro SENA...')
                }
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onClick={() => {
                  if (!currentUser) {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }
                }}
              />
            </div>
          </div>

          {showImageInput && (
            <div className="input-group input-group-sm mb-2 mt-2">
              <span className="input-group-text bg-white"><i className="bi bi-image text-success"></i> {language === 'en' ? 'Image URL:' : 'URL Imagen:'}</span>
              <input
                type="url"
                className="form-control"
                placeholder="https://images.unsplash.com/... or /assets/sena_campus_cover.jpg"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setShowImageInput(false)}>✕</button>
            </div>
          )}

          <div className="post-creator-actions pt-2 mt-2 border-top d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="post-action-btn"
                onClick={() => setShowImageInput(!showImageInput)}
              >
                <i className="bi bi-image-fill text-success fs-5"></i>
                <span className="small fw-semibold text-secondary">{t('feed.photoVideo')}</span>
              </button>

              <button
                type="button"
                className="post-action-btn"
                onClick={() => setCurrentView('eventos')}
              >
                <i className="bi bi-calendar-event-fill text-warning fs-5"></i>
                <span className="small fw-semibold text-secondary">{language === 'en' ? 'SENA Event' : 'Evento SENA'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-success btn-sm px-4 fw-bold rounded-pill text-white shadow-sm"
              disabled={submitting || (!newContent.trim() && !newImage.trim())}
            >
              {submitting ? t('feed.publishing') : t('feed.publish')}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <div className="mt-2 text-muted small">
            {language === 'en' ? 'Loading community posts...' : 'Cargando publicaciones de la comunidad SENA...'}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="post-card text-center py-5">
          <i className="bi bi-newspaper fs-1 text-muted d-block mb-3"></i>
          <h5 className="text-dark">{language === 'en' ? 'No posts yet' : 'Aún no hay publicaciones'}</h5>
          <p className="text-muted small">
            {language === 'en'
              ? 'Be the first to share an update or project with your classmates!'
              : '¡Sé el primero en compartir una novedad o proyecto con tus compañeros!'}
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const isLiked = post.user_reaction === 'like' || post.user_reaction === 'love';
          return (
            <div key={post.id} className="post-card mb-3">
              {/* Post Header */}
              <div className="post-header">
                <div style={{ position: 'relative' }}>
                  <img
                    src={post.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                    alt=""
                    className="post-author-avatar"
                  />
                  {post.is_online === 1 && (
                    <span className="fb-status-dot online" style={{ width: 9, height: 9, bottom: 0, right: 0 }} />
                  )}
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="post-author-name text-truncate">{post.full_name}</div>
                  <div className="post-meta-sub text-truncate">
                    {post.program || 'Aprendiz SENA'} · {post.ficha || 'Ficha 2670142'} · {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                {post.group_name && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle small">
                    <i className="bi bi-people me-1"></i>{post.group_name}
                  </span>
                )}
              </div>

              {/* Post Content */}
              <div className="post-content">{post.content}</div>

              {/* Post Media */}
              {post.image_url && (
                <div className="post-media-wrap mb-2">
                  <img src={post.image_url} alt="Post" className="post-media-img" />
                </div>
              )}

              {/* Reactions count */}
              <div className="post-stats-row">
                <span className="d-flex align-items-center gap-1">
                  <span className="badge bg-success rounded-circle p-1" style={{ fontSize: '0.62rem' }}>
                    <i className="bi bi-hand-thumbs-up-fill text-white"></i>
                  </span>
                  <span className="badge bg-danger rounded-circle p-1" style={{ fontSize: '0.62rem' }}>
                    <i className="bi bi-heart-fill text-white"></i>
                  </span>
                  <span className="ms-1 fw-bold text-dark small">{post.likes_count || 0}</span>
                </span>
                <span className="small text-muted">
                  {post.comments_count || 0} {post.comments_count === 1 ? (language === 'en' ? 'comment' : 'comentario') : (language === 'en' ? 'comments' : 'comentarios')}
                </span>
              </div>

              {/* Interaction bar */}
              <div className="post-interactive-bar">
                <button
                  className={`post-interact-btn ${isLiked ? 'reacted text-success' : ''}`}
                  onClick={() => handleReact(post.id, isLiked ? 'like' : 'like')}
                >
                  <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
                  <span>{isLiked ? t('feed.liked') : t('feed.like')}</span>
                </button>

                <button
                  className="post-interact-btn"
                  onClick={() => {
                    const el = document.getElementById(`feed-comment-${post.id}`);
                    if (el) el.focus();
                  }}
                >
                  <i className="bi bi-chat-left-text"></i>
                  <span>{t('feed.comment')}</span>
                </button>

                <button
                  className="post-interact-btn"
                  onClick={() => alert(language === 'en' ? 'Post link copied to clipboard!' : '¡Enlace de la publicación copiado al portapapeles!')}
                >
                  <i className="bi bi-share"></i>
                  <span>{t('feed.share')}</span>
                </button>
              </div>

              {/* Comments section */}
              <div className="post-comments-container">
                {post.comments && post.comments.map((c) => (
                  <div key={c.id} className="d-flex gap-2 mb-2 align-items-start">
                    <img
                      src={c.avatar_url || '/assets/camila_avatar.jpg'}
                      alt=""
                      className="rounded-circle"
                      style={{ width: 30, height: 30, objectFit: 'cover' }}
                    />
                    <div className="comment-bubble">
                      <span className="fw-bold d-block small text-dark">{c.full_name}</span>
                      <span className="small text-secondary">{c.content}</span>
                    </div>
                  </div>
                ))}

                {/* Add comment */}
                <div className="d-flex gap-2 mt-2">
                  <img
                    src={avatar}
                    alt=""
                    className="rounded-circle"
                    style={{ width: 30, height: 30, objectFit: 'cover' }}
                  />
                  <div className="input-group input-group-sm">
                    <input
                      id={`feed-comment-${post.id}`}
                      type="text"
                      className="form-control rounded-pill bg-light px-3"
                      placeholder={t('feed.writeComment')}
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                    />
                    <button
                      className="btn btn-link text-success p-1 ms-1"
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      title={language === 'en' ? 'Send comment' : 'Enviar comentario'}
                    >
                      <i className="bi bi-send-fill fs-6"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
