import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DataPolicyModal() {
  const { dataPolicyModalOpen, setDataPolicyModalOpen, t, language } = useLanguage();

  if (!dataPolicyModalOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1250, backdropFilter: 'blur(3px)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* Header */}
          <div
            className="p-4 text-white d-flex align-items-center justify-content-between"
            style={{ background: 'linear-gradient(135deg, #074C83 0%, #032b49 100%)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44, flexShrink: 0 }}
              >
                <i className="bi bi-shield-check fs-4 text-success"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>
                  {t('dataPolicy.modalTitle')}
                </h5>
                <div className="small text-light opacity-75">
                  {t('dataPolicy.modalSubtitle')} · {language === 'en' ? 'Law 1581 of 2012' : 'Ley 1581 de 2012'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-white text-decoration-none fs-5 p-0 ms-2"
              onClick={() => setDataPolicyModalOpen(false)}
              title={t('dataPolicy.closeBtn')}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-dark" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
            <div className="alert alert-info border-0 d-flex align-items-start gap-2 mb-4" style={{ backgroundColor: '#e7f3fe', color: '#00529b' }}>
              <i className="bi bi-info-circle-fill fs-5 mt-1"></i>
              <div>
                <strong>{language === 'en' ? 'Legal Framework (Republic of Colombia):' : 'Marco Legal (República de Colombia):'}</strong>{' '}
                {t('dataPolicy.intro')}
              </div>
            </div>

            {/* Section 1 */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                <i className="bi bi-building"></i>
                {t('dataPolicy.section1Title')}
              </h6>
              <p className="text-secondary ps-4 mb-0">{t('dataPolicy.section1Content')}</p>
            </div>

            {/* Section 2 */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                <i className="bi bi-list-check"></i>
                {t('dataPolicy.section2Title')}
              </h6>
              <p className="text-secondary ps-4 mb-2">{t('dataPolicy.section2Content')}</p>
              <ul className="text-secondary ps-5 mb-0">
                {t('dataPolicy.purposeList').map((item, idx) => (
                  <li key={idx} className="mb-1">{item}</li>
                ))}
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock"></i>
                {t('dataPolicy.section3Title')}
              </h6>
              <p className="text-secondary ps-4 mb-2">{t('dataPolicy.section3Content')}</p>
              <ul className="text-secondary ps-5 mb-0">
                {t('dataPolicy.rightsList').map((item, idx) => (
                  <li key={idx} className="mb-1">{item}</li>
                ))}
              </ul>
            </div>

            {/* Section 4 */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                <i className="bi bi-key-fill"></i>
                {t('dataPolicy.section4Title')}
              </h6>
              <p className="text-secondary ps-4 mb-0">{t('dataPolicy.section4Content')}</p>
            </div>

            {/* Section 5 */}
            <div className="mb-3">
              <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                <i className="bi bi-person-check-fill"></i>
                {t('dataPolicy.section5Title')}
              </h6>
              <p className="text-secondary ps-4 mb-0">{t('dataPolicy.section5Content')}</p>
            </div>

            <div className="p-3 rounded bg-light border text-muted small mt-4">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard-fill text-success"></i>
                <span>SENA ADSO Ficha 2670142 · Juan Pablo Tocarema Ávila</span>
                <span className="ms-auto text-success fw-bold">✓ Ley 1581 Compliant</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
            <span className="small text-muted">
              {language === 'en' ? 'Habeas Data Protection Standard' : 'Estándar de Protección de Habeas Data'}
            </span>
            <button
              type="button"
              className="btn btn-primary px-4 fw-bold rounded-pill"
              onClick={() => setDataPolicyModalOpen(false)}
            >
              {t('dataPolicy.closeBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
