import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function SettingsView() {
  const { currentUser, setCurrentUser } = useAuth();
  const { t, language, setLanguage, setDataPolicyModalOpen } = useLanguage();
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [allowMessages, setAllowMessages] = useState('everyone');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Password fields
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    if (currentUser?.settings) {
      setProfileVisibility(currentUser.settings.profile_visibility || 'public');
      setShowEmail(currentUser.settings.show_email ?? true);
      setShowPhone(currentUser.settings.show_phone ?? true);
      setAllowMessages(currentUser.settings.allow_messages || 'everyone');
      setNotificationsEnabled(currentUser.settings.notifications_enabled ?? true);
    }
  }, [currentUser]);

  async function handleSavePrivacy(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      await api.updateSettings(currentUser.id, {
        profile_visibility: profileVisibility,
        show_email: showEmail,
        show_phone: showPhone,
        allow_messages: allowMessages,
        notifications_enabled: notificationsEnabled
      });
      setStatusMsg(language === 'en' ? 'Privacy settings saved successfully to MySQL!' : '¡Configuraciones de privacidad guardadas correctamente en MySQL!');
      setTimeout(() => setStatusMsg(''), 3500);
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error saving privacy' : 'Error al guardar privacidad'));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassMsg(language === 'en' ? 'New passwords do not match.' : 'Las nuevas contraseñas no coinciden.');
      return;
    }
    if (newPass.length < 6) {
      setPassMsg(language === 'en' ? 'Password must be at least 6 characters long.' : 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await api.updateProfile(currentUser.id, {
        password: newPass
      });
      setPassMsg(language === 'en' ? 'Password updated and hashed with bcrypt!' : '¡Contraseña actualizada con éxito y cifrada con bcrypt!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassMsg(''), 4000);
    } catch (e) {
      setPassMsg((language === 'en' ? 'Error updating password: ' : 'Error al actualizar la contraseña: ') + e.message);
    }
  }

  return (
    <div className="content-wrapper">
      {/* Header Banner */}
      <div className="sena-card mb-4" style={{ background: 'linear-gradient(135deg, #074C83 0%, #053b66 100%)', color: 'white' }}>
        <h3 className="fw-bold mb-1"><i className="bi bi-shield-lock-fill me-2"></i>{t('settings.headerTitle')}</h3>
        <p className="mb-0 text-light opacity-75">
          {t('settings.headerDesc')}
        </p>
      </div>

      <div className="row g-4">
        {/* Left Column: Language & Privacy */}
        <div className="col-lg-7">
          {/* 1. Language / Internationalization Settings */}
          <div className="sena-card mb-4 border-primary border-opacity-25">
            <h5 className="sena-card-title mb-2">
              <i className="bi bi-translate text-primary me-2"></i>{t('settings.languageSection')}
            </h5>
            <p className="text-secondary small mb-3">
              {t('settings.languageDesc')}
            </p>

            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn px-3 py-2 fw-bold d-flex align-items-center gap-2 ${
                    language === 'en' ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setLanguage('en')}
                >
                  <span className="fs-5">🇺🇸</span>
                  <span>English (Default)</span>
                  {language === 'en' && <i className="bi bi-check-circle-fill text-white ms-1"></i>}
                </button>

                <button
                  type="button"
                  className={`btn px-3 py-2 fw-bold d-flex align-items-center gap-2 ${
                    language === 'es' ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setLanguage('es')}
                >
                  <span className="fs-5">🇪🇸</span>
                  <span>Español</span>
                  {language === 'es' && <i className="bi bi-check-circle-fill text-white ms-1"></i>}
                </button>
              </div>

              <div className="small text-muted ms-auto">
                {t('settings.langHelpText')}
              </div>
            </div>
          </div>

          {/* 2. Privacy Form */}
          <div className="sena-card">
            <h5 className="sena-card-title mb-3">
              <i className="bi bi-eye-fill text-primary me-2"></i>{t('settings.privacyTitle')}
            </h5>

            {statusMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
                <i className="bi bi-check-circle-fill fs-5"></i>
                <span className="small">{statusMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePrivacy}>
              <div className="mb-4">
                <label className="form-label fw-bold small">{t('settings.visibilityLabel')}</label>
                <select
                  className="form-select"
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                >
                  <option value="public">{t('settings.visibilityPublic')}</option>
                  <option value="apprentices_only">{language === 'en' ? 'Classmates Only (Same campus and class)' : 'Solo aprendices de mi mismo centro y ficha'}</option>
                  <option value="private">{t('settings.visibilityFriends')}</option>
                </select>
                <div className="form-text small">
                  {language === 'en' ? 'Controls who can find your profile and view your posts.' : 'Determina quién puede encontrar tu perfil en las búsquedas y ver tus intereses.'}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small">{t('settings.allowMessagesLabel')}</label>
                <select
                  className="form-select"
                  value={allowMessages}
                  onChange={(e) => setAllowMessages(e.target.value)}
                >
                  <option value="everyone">{t('settings.allowEveryone')}</option>
                  <option value="friends_only">{t('settings.allowFriends')}</option>
                </select>
              </div>

              <div className="border-top pt-3 mb-3">
                <h6 className="fw-bold text-dark mb-3 small text-uppercase">
                  {language === 'en' ? 'Visible Contact Info:' : 'Datos de Contacto visibles:'}
                </h6>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switchEmail"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="switchEmail">
                    <strong>{t('settings.showEmailLabel')}</strong> ({currentUser?.email})
                  </label>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switchPhone"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="switchPhone">
                    <strong>{t('settings.showPhoneLabel')}</strong> ({currentUser?.phone || '+57 310 000 0000'})
                  </label>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switchNotifs"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="switchNotifs">
                    <strong>{t('settings.notificationsLabel')}</strong>
                  </label>
                </div>
              </div>

              <div className="text-end">
                <button type="submit" className="sena-btn-primary" disabled={saving}>
                  {saving ? (language === 'en' ? 'Saving...' : 'Guardando...') : t('settings.savePrivacyBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Colombian Law 1581 (Habeas Data) Card */}
        <div className="col-lg-5">
          {/* Security / Password Card */}
          <div className="sena-card mb-4">
            <h5 className="sena-card-title mb-3">
              <i className="bi bi-key-fill text-warning me-2"></i>{t('settings.securityTitle')}
            </h5>

            {passMsg && (
              <div className={`alert ${passMsg.includes('éxito') || passMsg.includes('success') ? 'alert-success' : 'alert-danger'} py-2 mb-3 small`}>
                {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label fw-bold small">{t('settings.currentPass')}</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">{t('settings.newPass')}</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small">{t('settings.confirmPass')}</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Repite la contraseña"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline-primary btn-sm w-100 fw-bold">
                <i className="bi bi-lock me-1"></i> {t('settings.updatePassBtn')}
              </button>
            </form>
          </div>

          {/* Colombian Statutory Law 1581 of 2012 / Habeas Data Card */}
          <div className="sena-card mb-4 border-success border-opacity-25" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <h6 className="fw-bold text-dark mb-0">{t('settings.dataTitle')}</h6>
            </div>
            <p className="text-secondary small mb-3" style={{ lineHeight: 1.45 }}>
              {t('settings.dataDesc')}
            </p>
            <button
              type="button"
              className="btn btn-outline-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
              onClick={() => setDataPolicyModalOpen(true)}
            >
              <i className="bi bi-file-earmark-lock"></i>
              <span>{t('settings.viewDataPolicyBtn')}</span>
            </button>
            <div className="text-muted text-center" style={{ fontSize: '0.72rem' }}>
              Decreto 1377 de 2013 · República de Colombia
            </div>
          </div>

          {/* Account info card */}
          <div className="sena-card bg-light">
            <div className="small fw-bold text-dark mb-2">
              {language === 'en' ? 'Account & Session Info' : 'Información de la Cuenta'}
            </div>
            <div className="small text-muted mb-1">
              {language === 'en' ? 'User ID:' : 'ID de usuario:'} #{currentUser?.id}
            </div>
            <div className="small text-muted mb-1">
              {language === 'en' ? 'Username:' : 'Nombre de usuario:'} @{currentUser?.username}
            </div>
            <div className="small text-muted mb-1">
              {language === 'en' ? 'Role in SENA:' : 'Rol en el SENA:'} {currentUser?.occupation || 'Aprendiz Titulado'}
            </div>
            <div className="small text-muted">
              {language === 'en' ? 'Database:' : 'Base de Datos:'} MySQL InnoDB (sena_social_db)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
