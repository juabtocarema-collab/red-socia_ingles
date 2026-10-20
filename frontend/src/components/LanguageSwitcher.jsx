import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ compact = false, variant = 'navbar' }) {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  if (variant === 'sidebar') {
    return (
      <div className="px-3 py-2 my-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="small text-white-50" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-translate me-1"></i>
            {t('nav.switchLanguage')}
          </span>
          <span className="badge bg-light text-dark fw-bold" style={{ fontSize: '0.68rem' }}>
            {language.toUpperCase()}
          </span>
        </div>
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className={`btn btn-sm py-1 fw-bold ${language === 'en' ? 'btn-light text-primary shadow-sm' : 'btn-outline-light text-white'}`}
            style={{ fontSize: '0.75rem' }}
            onClick={() => setLanguage('en')}
          >
            🇺🇸 EN
          </button>
          <button
            type="button"
            className={`btn btn-sm py-1 fw-bold ${language === 'es' ? 'btn-light text-primary shadow-sm' : 'btn-outline-light text-white'}`}
            style={{ fontSize: '0.75rem' }}
            onClick={() => setLanguage('es')}
          >
            🇪🇸 ES
          </button>
        </div>
      </div>
    );
  }

  // Navbar pill toggle
  return (
    <div className="d-flex align-items-center me-2">
      <div
        className="fb-lang-toggle d-flex align-items-center p-1 rounded-pill border shadow-sm"
        style={{
          background: '#ffffff',
          borderColor: '#d0d7de',
          cursor: 'pointer'
        }}
        title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      >
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-2 py-0 fw-bold border-0 ${
            language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-muted'
          }`}
          style={{ fontSize: '0.75rem', height: 26 }}
          onClick={() => setLanguage('en')}
        >
          🇺🇸 EN
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-2 py-0 fw-bold border-0 ${
            language === 'es' ? 'bg-primary text-white shadow-sm' : 'text-muted'
          }`}
          style={{ fontSize: '0.75rem', height: 26 }}
          onClick={() => setLanguage('es')}
        >
          🇪🇸 ES
        </button>
      </div>
    </div>
  );
}
