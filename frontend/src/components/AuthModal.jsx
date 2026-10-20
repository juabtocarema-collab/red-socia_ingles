import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthModal({ isOpen, onClose }) {
  const { authMode, setAuthMode, login, register, switchDemoUser } = useAuth();
  const { t, setDataPolicyModalOpen, language } = useLanguage();

  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regData, setRegData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    program: 'Análisis y Desarrollo de Software',
    ficha: 'Ficha 2670142',
    origin_city: 'Espinal, Tolima',
    age: 18,
    occupation: 'Aprendiz SENA',
    gender: 'Masculino'
  });

  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await login(loginInput, loginPassword);
      onClose();
    } catch (e) {
      setErrorMsg(e.message || (language === 'en' ? 'Sign in failed. Check your credentials.' : 'Error al iniciar sesión. Verifica tus credenciales.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!dataConsent) {
      setErrorMsg(t('auth.consentRequired'));
      return;
    }

    if (regData.password !== regData.confirm_password) {
      setErrorMsg(language === 'en' ? 'Passwords do not match.' : 'Las contraseñas no coinciden.');
      return;
    }
    if (regData.password.length < 6) {
      setErrorMsg(language === 'en' ? 'Password must be at least 6 characters long.' : 'La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(regData);
      setSuccessMsg(language === 'en' ? 'Account created successfully in MySQL!' : '¡Cuenta registrada exitosamente en MySQL (sena_social_db)!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      setErrorMsg(e.message || (language === 'en' ? 'Registration error. Try another username or email.' : 'Error en el registro. Intenta con otro correo o usuario.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1100 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* Header with Institutional Branding & Close Button */}
          <div className="p-4 text-center text-white position-relative" style={{ background: 'linear-gradient(135deg, #074C83 0%, #04324D 100%)' }}>
            <button
              type="button"
              className="btn btn-sm btn-link text-white position-absolute top-0 end-0 m-3 text-decoration-none"
              style={{ fontSize: '1.25rem', opacity: 0.85 }}
              onClick={onClose}
              title="Close window"
            >
              ✕
            </button>
            <img src="/assets/sena_logo.svg" alt="SENA" style={{ width: 48, height: 48, marginBottom: 8 }} />
            <h5 className="fw-bold mb-1">{t('auth.modalTitle')}</h5>
            <div className="small text-light opacity-75">{t('auth.modalSubtitle')}</div>
          </div>

          {/* Sub-Tabs */}
          <div className="d-flex border-bottom bg-light">
            <button
              className={`btn flex-grow-1 py-3 fw-bold rounded-0 ${authMode === 'login' ? 'bg-white text-success border-bottom border-3 border-success' : 'text-muted'}`}
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> {t('auth.loginTab')}
            </button>
            <button
              className={`btn flex-grow-1 py-3 fw-bold rounded-0 ${authMode === 'register' ? 'bg-white text-success border-bottom border-3 border-success' : 'text-muted'}`}
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <i className="bi bi-person-plus-fill me-1"></i> {t('auth.registerTab')}
            </button>
          </div>

          <div className="p-4">
            {errorMsg && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success py-2 small d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill"></i>
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold small">{t('auth.usernameOrEmail')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('auth.usernameOrEmailPlaceholder')}
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">{t('auth.password')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="p-2 mb-3 bg-light rounded small text-muted border">
                  <i className="bi bi-info-circle text-primary me-1"></i>
                  {t('auth.mysqlNoteLogin')}
                </div>

                <button type="submit" className="sena-btn-primary w-100 py-2 mb-3" disabled={loading}>
                  {loading ? (language === 'en' ? 'Signing in...' : 'Iniciando sesión...') : t('auth.signInBtn')}
                </button>

                {/* Quick Demo Access */}
                <div className="text-center pt-2 border-top">
                  <div className="text-muted small mb-2">{t('auth.quickDemoTitle')}</div>
                  <div className="d-flex gap-2 justify-content-center">
                    <button type="button" className="btn btn-outline-success btn-sm rounded-pill px-3" onClick={() => { switchDemoUser(1); onClose(); }}>
                      <i className="bi bi-person-fill me-1"></i> {t('auth.demoJuan')}
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => { switchDemoUser(2); onClose(); }}>
                      <i className="bi bi-person-fill me-1"></i> {t('auth.demoCamila')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit}>
                <div className="row g-2 mb-2">
                  <div className="col-md-7">
                    <label className="form-label fw-bold small mb-1">{t('auth.fullName')}</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={regData.full_name}
                      onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-bold small mb-1">{t('auth.username')}</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={t('auth.usernamePlaceholder')}
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-bold small mb-1">{t('auth.email')}</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder={t('auth.emailPlaceholder')}
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-7">
                    <label className="form-label fw-bold small mb-1">{t('auth.program')}</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="ADSO, Redes, Animación..."
                      value={regData.program}
                      onChange={(e) => setRegData({ ...regData, program: e.target.value })}
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-bold small mb-1">{t('auth.ficha')}</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ficha 2670142"
                      value={regData.ficha}
                      onChange={(e) => setRegData({ ...regData, ficha: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small mb-1">{t('auth.confirmPassword')}</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={regData.confirm_password}
                      onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Law 1581 of 2012 / Habeas Data Consent Checkbox */}
                <div className="p-3 mb-3 bg-light rounded border">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="dataConsentRegisterCheck"
                      checked={dataConsent}
                      onChange={(e) => setDataConsent(e.target.checked)}
                      required
                    />
                    <label className="form-check-label small text-dark" htmlFor="dataConsentRegisterCheck">
                      <span className="fw-semibold">
                        <i className="bi bi-shield-check text-primary me-1"></i>
                        {t('auth.dataConsentLabel')}
                      </span>{' '}
                      <button
                        type="button"
                        className="btn btn-link p-0 text-primary small fw-bold text-decoration-none"
                        onClick={() => setDataPolicyModalOpen(true)}
                      >
                        {t('auth.viewLawLink')}
                      </button>
                    </label>
                  </div>
                </div>

                <div className="p-2 mb-3 bg-light rounded small text-muted border">
                  <i className="bi bi-shield-check text-success me-1"></i>
                  {t('auth.mysqlNoteRegister')}
                </div>

                <button type="submit" className="sena-btn-primary w-100 py-2" disabled={loading}>
                  {loading ? t('auth.creatingAccount') : t('auth.registerBtn')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
