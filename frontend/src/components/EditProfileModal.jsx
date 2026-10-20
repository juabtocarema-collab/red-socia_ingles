import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, setCurrentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'intereses'
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Personal Info Form State
  const [personalData, setPersonalData] = useState({
    full_name: currentUser?.full_name || '',
    age: currentUser?.age || 18,
    occupation: currentUser?.occupation || '',
    origin_city: currentUser?.origin_city || '',
    gender: currentUser?.gender || 'Masculino',
    phone: currentUser?.phone || '',
    languages: currentUser?.languages || '',
    bio: currentUser?.bio || '',
    avatar_url: currentUser?.avatar_url || '',
    cover_url: currentUser?.cover_url || '',
    program: currentUser?.program || '',
    ficha: currentUser?.ficha || ''
  });

  // Interests Form State
  const [interestsData, setInterestsData] = useState({
    studies: currentUser?.interests?.studies || '',
    music: currentUser?.interests?.music || '',
    movies: currentUser?.interests?.movies || '',
    series: currentUser?.interests?.series || '',
    sports: currentUser?.interests?.sports || '',
    food: currentUser?.interests?.food || '',
    drinks: currentUser?.interests?.drinks || '',
    books: currentUser?.interests?.books || '',
    games_tech: currentUser?.interests?.games_tech || ''
  });

  if (!isOpen) return null;

  async function handleSavePersonal(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.updateProfile(currentUser.id, personalData);
      setCurrentUser(res.user);
      setSuccessMsg('¡Información personal actualizada correctamente en MySQL!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar información');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInterests(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.updateInterests(currentUser.id, interestsData);
      setCurrentUser({
        ...currentUser,
        interests: res.interests
      });
      setSuccessMsg('¡Sección de intereses actualizada correctamente en MySQL!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar intereses');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          {/* Header */}
          <div className="modal-header border-bottom px-4 pt-4 pb-3">
            <div>
              <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                <i className="bi bi-pencil-square me-2 text-primary"></i>
                {t('editProfileModal.title')}
              </h5>
              <div className="text-muted small">
                {language === 'en'
                  ? 'Update your personal details, training information, and technical hobbies'
                  : 'Modifica tus datos personales y tus gustos e intereses institucionales'}
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-4 pt-3 border-bottom bg-light">
            <ul className="nav nav-pills gap-2">
              <li className="nav-item">
                <button
                  className={`nav-link py-2 px-3 fw-bold ${activeTab === 'personal' ? 'active bg-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <i className="bi bi-person me-2"></i>
                  {language === 'en' ? 'Personal Information' : 'Información Personal'}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link py-2 px-3 fw-bold ${activeTab === 'intereses' ? 'active bg-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('intereses')}
                >
                  <i className="bi bi-heart me-2"></i>
                  {language === 'en' ? 'Interests & Hobbies' : 'Sección de Intereses'}
                </button>
              </li>
            </ul>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-check-circle-fill fs-5"></i>
                <div>{successMsg}</div>
              </div>
            )}
            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            {/* TAB 1: INFORMACIÓN PERSONAL */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Nombre completo:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={personalData.full_name}
                      onChange={(e) => setPersonalData({ ...personalData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold small">Edad:</label>
                    <input
                      type="number"
                      className="form-control"
                      min="14"
                      max="99"
                      value={personalData.age}
                      onChange={(e) => setPersonalData({ ...personalData, age: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold small">Sexo:</label>
                    <select
                      className="form-select"
                      value={personalData.gender}
                      onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="No binario">No binario</option>
                      <option value="Prefiero no indicarlo">Prefiero no indicarlo</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Ocupación / Título:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Aprendiz SENA | Analisis y Desarrollo de Software"
                      value={personalData.occupation}
                      onChange={(e) => setPersonalData({ ...personalData, occupation: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Ciudad de origen:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Espinal, Tolima"
                      value={personalData.origin_city}
                      onChange={(e) => setPersonalData({ ...personalData, origin_city: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Número de teléfono:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+57 320 123 4567"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Idiomas:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Español (nativo), Inglés (básico)"
                      value={personalData.languages}
                      onChange={(e) => setPersonalData({ ...personalData, languages: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Programa de Formación:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Análisis y Desarrollo de Software (ADSO)"
                      value={personalData.program}
                      onChange={(e) => setPersonalData({ ...personalData, program: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Número de Ficha:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ficha 2670142"
                      value={personalData.ficha}
                      onChange={(e) => setPersonalData({ ...personalData, ficha: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">URL Foto de perfil:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={personalData.avatar_url}
                      onChange={(e) => setPersonalData({ ...personalData, avatar_url: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">URL Foto de portada:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={personalData.cover_url}
                      onChange={(e) => setPersonalData({ ...personalData, cover_url: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small">Descripción personal (Sobre mí):</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={personalData.bio}
                      onChange={(e) => setPersonalData({ ...personalData, bio: e.target.value })}
                      placeholder="Describe tus metas profesionales, aficiones y lo que deseas aportar a la comunidad SENA..."
                    />
                  </div>
                </div>

                <div className="modal-footer border-top-0 px-0 pt-4 pb-0">
                  <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
                  <button type="submit" className="sena-btn-primary" disabled={saving}>
                    {saving ? 'Guardando cambios...' : 'Guardar Información'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SECCIÓN DE INTERESES (9 CATEGORÍAS COMPLETAS) */}
            {activeTab === 'intereses' && (
              <form onSubmit={handleSaveInterests}>
                <p className="text-muted small mb-4">
                  <i className="bi bi-info-circle me-1"></i>
                  Escribe oraciones completas y descriptivas sobre tus gustos personales en cada categoría institucional.
                </p>

                <div className="row g-3">
                  {/* 1. Estudios */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-circle p-1"><i className="bi bi-mortarboard-fill"></i></span>
                      1. Estudios:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Me gusta aprender y mejorar mis habilidades en programación y tecnología."
                      value={interestsData.studies}
                      onChange={(e) => setInterestsData({ ...interestsData, studies: e.target.value })}
                    />
                  </div>

                  {/* 2. Música */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-danger rounded-circle p-1"><i className="bi bi-music-note-beamed"></i></span>
                      2. Música:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Escucho salsa cuando estoy feliz y vallenato cuando estoy triste."
                      value={interestsData.music}
                      onChange={(e) => setInterestsData({ ...interestsData, music: e.target.value })}
                    />
                  </div>

                  {/* 3. Películas */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-dark rounded-circle p-1"><i className="bi bi-film"></i></span>
                      3. Películas:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Me gustan las películas de acción, ciencia ficción y aventura."
                      value={interestsData.movies}
                      onChange={(e) => setInterestsData({ ...interestsData, movies: e.target.value })}
                    />
                  </div>

                  {/* 4. Series de televisión */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-info rounded-circle p-1"><i className="bi bi-tv-fill"></i></span>
                      4. Series de televisión:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Disfruto series como La Casa de Papel, Stranger Things y The Last of Us."
                      value={interestsData.series}
                      onChange={(e) => setInterestsData({ ...interestsData, series: e.target.value })}
                    />
                  </div>

                  {/* 5. Deportes */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-success rounded-circle p-1"><i className="bi bi-dribbble"></i></span>
                      5. Deportes:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Me gusta el fútbol y también practico gimnasio para mantenerme en forma."
                      value={interestsData.sports}
                      onChange={(e) => setInterestsData({ ...interestsData, sports: e.target.value })}
                    />
                  </div>

                  {/* 6. Comida */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-danger-subtle text-danger rounded-circle p-1"><i className="bi bi-egg-fried"></i></span>
                      6. Comida:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Me encanta la comida típica colombiana, especialmente el ajiaco y la bandeja paisa."
                      value={interestsData.food}
                      onChange={(e) => setInterestsData({ ...interestsData, food: e.target.value })}
                    />
                  </div>

                  {/* 7. Bebidas */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-warning-subtle text-warning-emphasis rounded-circle p-1"><i className="bi bi-cup-hot-fill"></i></span>
                      7. Bebidas:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Prefiero el agua, pero me gusta un buen café o una soda en ocasiones."
                      value={interestsData.drinks}
                      onChange={(e) => setInterestsData({ ...interestsData, drinks: e.target.value })}
                    />
                  </div>

                  {/* 8. Libros */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-primary-subtle text-primary rounded-circle p-1"><i className="bi bi-book-fill"></i></span>
                      8. Libros:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Leo libros de tecnología, desarrollo de software y superación personal."
                      value={interestsData.books}
                      onChange={(e) => setInterestsData({ ...interestsData, books: e.target.value })}
                    />
                  </div>

                  {/* 9. Videojuegos y tecnología */}
                  <div className="col-12">
                    <label className="form-label fw-bold small d-flex align-items-center gap-2">
                      <span className="badge bg-secondary-subtle text-purple rounded-circle p-1"><i className="bi bi-controller"></i></span>
                      9. Videojuegos y tecnología:
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Disfruto jugar en mi tiempo libre, especialmente juegos de estrategia y aventura."
                      value={interestsData.games_tech}
                      onChange={(e) => setInterestsData({ ...interestsData, games_tech: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top-0 px-0 pt-4 pb-0">
                  <button type="button" className="btn btn-light" onClick={onClose}>
                    {t('editProfileModal.cancelBtn')}
                  </button>
                  <button type="submit" className="sena-btn-primary" disabled={saving}>
                    {saving ? t('editProfileModal.saving') : t('editProfileModal.saveBtn')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
