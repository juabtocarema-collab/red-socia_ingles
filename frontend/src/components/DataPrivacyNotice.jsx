import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DataPrivacyNotice() {
  const { t, setDataPolicyModalOpen, language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed notice
    const hasConsented = localStorage.getItem('sena_data_consent_accepted');
    if (!hasConsented) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('sena_data_consent_accepted', 'true');
    setVisible(false);
  }

  function handleOpenPolicy() {
    setDataPolicyModalOpen(true);
  }

  if (!visible) return null;

  return (
    <div
      className="position-fixed bottom-0 start-50 translate-middle-x mb-3 px-3 w-100"
      style={{ maxWidth: '980px', zIndex: 1150 }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #ffffff 0%, #f7faff 100%)',
          borderLeft: '5px solid #074C83',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.22)'
        }}
      >
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #074C83 0%, #032b49 100%)' }}
              >
                <i className="bi bi-shield-check fs-5 text-warning"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                  <span>{t('dataPolicy.bannerTitle')}</span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle small" style={{ fontSize: '0.68rem' }}>
                    {language === 'en' ? 'Law 1581 / Habeas Data' : 'Ley 1581 / Habeas Data'}
                  </span>
                </h6>
                <p className="mb-0 text-secondary small" style={{ lineHeight: 1.45 }}>
                  {t('dataPolicy.bannerText')}
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto ms-md-0 mt-2 mt-md-0">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-medium"
                onClick={handleOpenPolicy}
              >
                <i className="bi bi-file-earmark-text me-1"></i>
                {t('dataPolicy.readPolicyBtn')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm px-4 rounded-pill fw-bold text-white shadow-sm"
                style={{ background: '#074C83', borderColor: '#074C83' }}
                onClick={handleAccept}
              >
                <i className="bi bi-check-lg me-1"></i>
                {t('dataPolicy.acceptBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
