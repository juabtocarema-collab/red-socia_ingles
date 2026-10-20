import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function ProfileView({ onOpenEditModal }) {
  const { currentUser, setCurrentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('Posts');
  const [userPosts, setUserPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [postType, setPostType] = useState('general');
  const [showMediaInput, setShowMediaInput] = useState(null); // 'photo', 'video', 'event'
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const interests = currentUser?.interests || {};

  useEffect(() => {
    if (currentUser?.id) {
      loadUserPosts(currentUser.id);
    }
  }, [currentUser?.id]);

  async function loadUserPosts(userId) {
    setLoadingPosts(true);
    try {
      const posts = await api.getPosts({ user_id: userId });
      setUserPosts(posts);
    } catch (e) {
      console.error('Error loading profile posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postContent.trim() && !postImage.trim()) return;

    setSubmittingPost(true);
    try {
      const newPost = await api.createPost({
        content: postContent,
        image_url: postImage || null,
        video_url: postVideo || null,
        post_type: postType
      });

      setUserPosts([newPost, ...userPosts]);
      setPostContent('');
      setPostImage('');
      setPostVideo('');
      setShowMediaInput(null);
    } catch (e) {
      alert(e.message || 'Error posting');
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleReact(postId, reactionType = 'like') {
    try {
      const res = await api.reactToPost(postId, reactionType);
      setUserPosts(userPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes_count: res.likes_count,
            user_reaction: res.user_reaction
          };
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddComment(postId) {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const newComment = await api.addComment(postId, text);
      setUserPosts(userPosts.map(p => {
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
      alert(e.message || 'Error commenting');
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      if (res.url) {
        await api.updateProfile(currentUser.id, { avatar_url: res.url });
        setCurrentUser({ ...currentUser, avatar_url: res.url });
        setShowPhotoModal(false);
      }
    } catch (e) {
      alert('Error uploading image: ' + e.message);
    }
  }

  async function handleAvatarUrlSubmit(e) {
    e.preventDefault();
    if (!newAvatarUrl) return;
    try {
      await api.updateProfile(currentUser.id, { avatar_url: newAvatarUrl });
      setCurrentUser({ ...currentUser, avatar_url: newAvatarUrl });
      setShowPhotoModal(false);
      setNewAvatarUrl('');
    } catch (e) {
      alert(e.message);
    }
  }

  const avatar = currentUser?.avatar_url || '/assets/juan_pablo_avatar.jpg';
  const cover = currentUser?.cover_url || '/assets/sena_campus_cover.jpg';

  return (
    <div className="content-wrapper">
      {/* 1. Header Card (Cover, Avatar, Names, Tabs) */}
      <div className="profile-header-card">
        {/* Cover Photo */}
        <div className="profile-cover-container">
          <img
            src={cover}
            alt="SENA Cover Photo"
            className="profile-cover-img"
          />
        </div>

        {/* Profile Content */}
        <div className="profile-header-content">
          <div className="profile-identity-row">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {/* Profile Avatar */}
              <div className="profile-avatar-wrapper fb-avatar-wrap" style={{ width: 'auto', height: 'auto' }}>
                <img
                  src={avatar}
                  alt={currentUser?.full_name || 'Juan Pablo'}
                  className="profile-avatar-img"
                />
                <span
                  className={`fb-status-dot ${currentUser?.is_online === 1 ? 'online' : 'offline'}`}
                  title={currentUser?.is_online === 1 ? 'En línea' : 'Desconectado'}
                  style={{ width: 14, height: 14, border: '2.5px solid #ffffff' }}
                />
              </div>

              {/* Names and Occupation */}
              <div className="profile-meta pt-2">
                <h1 className="profile-full-name">
                  {currentUser?.full_name || 'Juan Pablo Tocarema Ávila'}
                </h1>
                <div className="profile-username">
                  @{currentUser?.username || 'juanpato27'}
                </div>
                <div className="profile-program-tag d-flex align-items-center gap-2 flex-wrap">
                  <span>{currentUser?.occupation || 'SENA Apprentice | Software Analysis and Development'}</span>
                  {currentUser?.role === 'superadmin' && (
                    <span className="badge bg-warning text-dark fw-bold shadow-sm" style={{ fontSize: '0.72rem' }}>
                      <i className="bi bi-shield-lock-fill me-1"></i>Super Administrator
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div>
              <button
                className="edit-profile-btn"
                onClick={onOpenEditModal}
              >
                <i className="bi bi-pencil-fill text-muted"></i>
                {t('profile.editProfile')}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="profile-tabs">
            {(language === 'en'
              ? ['Posts', 'Information', 'Friends', 'Photos']
              : ['Publicaciones', 'Información', 'Amigos', 'Fotos']
            ).map((tab, idx) => {
              const tabKeys = ['Posts', 'Information', 'Friends', 'Photos'];
              const key = tabKeys[idx];
              return (
                <button
                  key={key}
                  className={`profile-tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="row g-4">
        {/* LEFT COLUMN: Personal Info, About Me, Profile Photo */}
        <div className="col-lg-5 profile-left-col">
          {/* Card: Personal Information */}
          <div className="sena-card">
            <div className="sena-card-header">
              <span className="interest-icon-circle bg-primary-subtle text-primary" style={{ width: 34, height: 34 }}>
                <i className="bi bi-person-fill fs-5"></i>
              </span>
              <h3 className="sena-card-title">Personal Information</h3>
            </div>

            <div className="info-list">
              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-person"></i>
                  <span>Full Name:</span>
                </div>
                <div className="info-item-value">{currentUser?.full_name || 'Juan Pablo Tocarema Ávila'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-calendar3"></i>
                  <span>Age:</span>
                </div>
                <div className="info-item-value">{currentUser?.age ? `${currentUser.age} years old` : '18 years old'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-briefcase"></i>
                  <span>Occupation:</span>
                </div>
                <div className="info-item-value">{currentUser?.occupation || 'SENA Apprentice'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-geo-alt"></i>
                  <span>City of Origin:</span>
                </div>
                <div className="info-item-value">{currentUser?.origin_city || 'Espinal, Tolima'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-gender-ambiguous"></i>
                  <span>Gender:</span>
                </div>
                <div className="info-item-value">{currentUser?.gender || 'Male'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-telephone"></i>
                  <span>Phone Number:</span>
                </div>
                <div className="info-item-value">{currentUser?.phone || '+57 320 123 4567'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-envelope"></i>
                  <span>Email:</span>
                </div>
                <div className="info-item-value">{currentUser?.email || 'juanpablotocaremaavila@gmail.com'}</div>
              </div>

              <div className="info-item">
                <div className="info-item-label">
                  <i className="bi bi-globe"></i>
                  <span>Languages:</span>
                </div>
                <div className="info-item-value">{currentUser?.languages || 'Spanish (native), English (basic)'}</div>
              </div>
            </div>
          </div>

          {/* Card: About Me */}
          <div className="sena-card">
            <div className="sena-card-header">
              <span className="interest-icon-circle bg-info-subtle text-info" style={{ width: 34, height: 34 }}>
                <i className="bi bi-person-badge-fill fs-5"></i>
              </span>
              <h3 className="sena-card-title">About Me</h3>
            </div>
            <p className="text-secondary mb-0" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
              {currentUser?.bio ||
                'I am a committed, responsible person with a great desire to learn. I enjoy technology, video games and everything related to the digital world. My goal is to become a great software developer and contribute to the growth of the SENA community.'}
            </p>
          </div>

          {/* Card: Profile Photo */}
          <div className="sena-card">
            <div className="sena-card-header">
              <span className="interest-icon-circle bg-secondary-subtle text-secondary" style={{ width: 34, height: 34 }}>
                <i className="bi bi-camera-fill fs-5"></i>
              </span>
              <h3 className="sena-card-title">Profile Photo</h3>
            </div>
            <div className="d-flex align-items-center gap-3">
              <img
                src={avatar}
                alt="Profile photo"
                className="rounded-circle shadow-sm"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
              <button
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                onClick={() => setShowPhotoModal(true)}
              >
                <i className="bi bi-camera"></i> Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: My Interests & Post Creator / Posts */}
        <div className="col-lg-7 profile-right-col">
          {/* Card: My Interests */}
          <div className="sena-card">
            <div className="sena-card-header">
              <span className="interest-icon-circle bg-primary text-white" style={{ width: 34, height: 34 }}>
                <i className="bi bi-heart-fill fs-6"></i>
              </span>
              <h3 className="sena-card-title">My Interests</h3>
            </div>

            <div className="interests-list">
              {/* 1. Studies */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-primary-subtle text-primary">
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <div>
                  <div className="interest-category-name">Studies</div>
                  <p className="interest-description">
                    {interests.studies || 'I enjoy learning and improving my programming and technology skills.'}
                  </p>
                </div>
              </div>

              {/* 2. Music */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-danger-subtle text-danger">
                  <i className="bi bi-music-note-beamed"></i>
                </div>
                <div>
                  <div className="interest-category-name">Music</div>
                  <p className="interest-description">
                    {interests.music || 'I listen to salsa when I am happy and vallenato when I am sad.'}
                  </p>
                </div>
              </div>

              {/* 3. Movies */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-dark-subtle text-dark">
                  <i className="bi bi-film"></i>
                </div>
                <div>
                  <div className="interest-category-name">Movies</div>
                  <p className="interest-description">
                    {interests.movies || 'I enjoy action, science fiction and adventure films.'}
                  </p>
                </div>
              </div>

              {/* 4. TV Shows */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-info-subtle text-info">
                  <i className="bi bi-tv-fill"></i>
                </div>
                <div>
                  <div className="interest-category-name">TV Shows</div>
                  <p className="interest-description">
                    {interests.series || 'I enjoy series like Money Heist, Stranger Things and The Last of Us.'}
                  </p>
                </div>
              </div>

              {/* 5. Sports */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-success-subtle text-success">
                  <i className="bi bi-dribbble"></i>
                </div>
                <div>
                  <div className="interest-category-name">Sports</div>
                  <p className="interest-description">
                    {interests.sports || 'I enjoy soccer and also go to the gym to stay fit.'}
                  </p>
                </div>
              </div>

              {/* 6. Food */}
              <div className="interest-item">
                <div className="interest-icon-circle" style={{ backgroundColor: '#ffe4e6', color: '#e11d48' }}>
                  <i className="bi bi-egg-fried"></i>
                </div>
                <div>
                  <div className="interest-category-name">Food</div>
                  <p className="interest-description">
                    {interests.food || 'I love traditional Colombian food, especially ajiaco and bandeja paisa.'}
                  </p>
                </div>
              </div>

              {/* 7. Drinks */}
              <div className="interest-item">
                <div className="interest-icon-circle" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <i className="bi bi-cup-hot-fill"></i>
                </div>
                <div>
                  <div className="interest-category-name">Drinks</div>
                  <p className="interest-description">
                    {interests.drinks || 'I prefer water, but enjoy a good coffee or soda on occasion.'}
                  </p>
                </div>
              </div>

              {/* 8. Books */}
              <div className="interest-item">
                <div className="interest-icon-circle bg-primary-subtle text-primary">
                  <i className="bi bi-book-fill"></i>
                </div>
                <div>
                  <div className="interest-category-name">Books</div>
                  <p className="interest-description">
                    {interests.books || 'I read books on technology, software development and personal growth.'}
                  </p>
                </div>
              </div>

              {/* 9. Video Games */}
              <div className="interest-item">
                <div className="interest-icon-circle" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                  <i className="bi bi-controller"></i>
                </div>
                <div>
                  <div className="interest-category-name">Video Games & Technology</div>
                  <p className="interest-description">
                    {interests.games_tech || 'I enjoy gaming in my free time, especially strategy and adventure games.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card: What's on your mind? Post Creator */}
          <div className="post-creator-card">
            <form onSubmit={handleCreatePost}>
              <div className="d-flex align-items-center gap-2 mb-2 text-muted fw-bold small">
                <i className="bi bi-pencil-square text-primary fs-5"></i>
                <span>What's on your mind?</span>
              </div>

              <textarea
                className="post-creator-textarea"
                placeholder="Share knowledge, projects or questions with the SENA community..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />

              {/* Conditional Media Input Prompts */}
              {showMediaInput === 'foto' && (
                <div className="input-group input-group-sm mb-3">
                  <span className="input-group-text"><i className="bi bi-image"></i> Image URL:</span>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/photo.jpg or /assets/sena_campus_cover.jpg"
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowMediaInput(null)}>✕</button>
                </div>
              )}

              {showMediaInput === 'video' && (
                <div className="input-group input-group-sm mb-3">
                  <span className="input-group-text"><i className="bi bi-play-btn"></i> Video URL:</span>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://youtube.com/watch?v=..."
                    value={postVideo}
                    onChange={(e) => setPostVideo(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowMediaInput(null)}>✕</button>
                </div>
              )}

              {showMediaInput === 'evento' && (
                <div className="alert alert-info py-2 px-3 small d-flex justify-content-between align-items-center mb-3">
                  <span><i className="bi bi-calendar-event me-2"></i>Posting as Academic Event Announcement</span>
                  <button className="btn-close btn-close-white" type="button" onClick={() => { setShowMediaInput(null); setPostType('general'); }}></button>
                </div>
              )}

              <div className="post-creator-actions">
                <div className="post-action-buttons">
                  <button
                    type="button"
                    className={`post-action-btn ${showMediaInput === 'foto' ? 'text-primary' : ''}`}
                    onClick={() => setShowMediaInput(showMediaInput === 'foto' ? null : 'foto')}
                  >
                    <i className="bi bi-image text-primary fs-5"></i>
                    Photo
                  </button>
                  <button
                    type="button"
                    className={`post-action-btn ${showMediaInput === 'video' ? 'text-danger' : ''}`}
                    onClick={() => setShowMediaInput(showMediaInput === 'video' ? null : 'video')}
                  >
                    <i className="bi bi-play-circle-fill text-danger fs-5"></i>
                    Video
                  </button>
                  <button
                    type="button"
                    className={`post-action-btn ${showMediaInput === 'evento' ? 'text-warning' : ''}`}
                    onClick={() => {
                      setShowMediaInput(showMediaInput === 'evento' ? null : 'evento');
                      setPostType('event');
                    }}
                  >
                    <i className="bi bi-calendar-check-fill text-warning fs-5"></i>
                    Event
                  </button>
                </div>

                <button
                  type="submit"
                  className="sena-btn-primary"
                  disabled={submittingPost || (!postContent.trim() && !postImage.trim())}
                >
                  {submittingPost ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>

          {/* User's Published Posts Feed */}
          <div>
            <h5 className="fw-bold mb-3 text-secondary" style={{ fontSize: '1rem' }}>
              <i className="bi bi-collection me-2"></i>{currentUser?.full_name?.split(' ')[0]}'s Posts
            </h5>

            {loadingPosts ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                Loading posts...
              </div>
            ) : userPosts.length === 0 ? (
              <div className="sena-card text-center py-4 text-muted">
                <i className="bi bi-pencil fs-2 d-block text-secondary mb-2"></i>
                You haven't shared any posts yet. Be the first to publish!
              </div>
            ) : (
              userPosts.map((post) => {
                const isLiked = post.user_reaction === 'like' || post.user_reaction === 'love';
                return (
                  <div key={post.id} className="post-card">
                    {/* Header */}
                    <div className="post-header">
                      <img
                        src={post.avatar_url || avatar}
                        alt=""
                        className="post-author-avatar"
                      />
                      <div>
                        <div className="post-author-name">{post.full_name}</div>
                        <div className="post-meta-sub">
                          {post.program || 'SENA Apprentice'} · {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="post-content">{post.content}</div>

                    {/* Media */}
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="post-media-img"
                      />
                    )}

                    {/* Stats */}
                    <div className="post-stats-row">
                      <span>
                        <i className="bi bi-hand-thumbs-up-fill text-primary me-1"></i>
                        {post.likes_count || 0} reactions
                      </span>
                      <span>{post.comments_count || 0} comments</span>
                    </div>

                    {/* Action Bar */}
                    <div className="post-interactive-bar">
                      <button
                        className={`post-interact-btn ${isLiked ? 'reacted' : ''}`}
                        onClick={() => handleReact(post.id, isLiked ? 'like' : 'like')}
                      >
                        <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
                        {isLiked ? 'Liked' : 'Like'}
                      </button>

                      <button
                        className="post-interact-btn"
                        onClick={() => {
                          const el = document.getElementById(`comment-input-${post.id}`);
                          if (el) el.focus();
                        }}
                      >
                        <i className="bi bi-chat-left"></i> Comment
                      </button>

                      <button
                        className="post-interact-btn"
                        onClick={() => alert('Post link copied!')}
                      >
                        <i className="bi bi-share"></i> Share
                      </button>
                    </div>

                    {/* Comments Section */}
                    <div className="post-comments-container">
                      {/* Comments list */}
                      {post.comments && post.comments.map((c) => (
                        <div key={c.id} className="d-flex gap-2 mb-2 align-items-start">
                          <img
                            src={c.avatar_url || '/assets/camila_avatar.jpg'}
                            alt=""
                            className="rounded-circle"
                            style={{ width: 32, height: 32, objectFit: 'cover' }}
                          />
                          <div className="comment-bubble">
                            <span className="fw-bold d-block small text-dark">{c.full_name}</span>
                            <span className="small text-secondary">{c.content}</span>
                          </div>
                        </div>
                      ))}

                      {/* Add comment input */}
                      <div className="d-flex gap-2 mt-3">
                        <img
                          src={avatar}
                          alt=""
                          className="rounded-circle"
                          style={{ width: 32, height: 32, objectFit: 'cover' }}
                        />
                        <div className="input-group input-group-sm">
                          <input
                            id={`comment-input-${post.id}`}
                            type="text"
                            className="form-control rounded-pill bg-light"
                            placeholder="Write an institutional comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                          />
                          <button
                            className="btn btn-link text-primary"
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <i className="bi bi-send-fill"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Change Profile Photo */}
      {showPhotoModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-camera me-2"></i>Update Profile Photo
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPhotoModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4 text-center">
                  <img
                    src={avatar}
                    alt="Preview"
                    className="rounded-circle shadow"
                    style={{ width: 120, height: 120, objectFit: 'cover' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Upload file from your device:</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAvatarUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="text-center text-muted small my-2">— or —</div>

                <form onSubmit={handleAvatarUrlSubmit}>
                  <label className="form-label fw-bold small">Enter direct image URL:</label>
                  <div className="input-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://..."
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Save URL</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
