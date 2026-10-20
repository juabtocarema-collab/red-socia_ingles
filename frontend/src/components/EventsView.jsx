import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';

export default function EventsView() {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New event form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Main SENA Auditorium');
  const [eventDate, setEventDate] = useState('');
  const [organizer, setOrganizer] = useState('Academic Coordination');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(eventId, status = 'going') {
    try {
      const res = await api.toggleEventAttendance(eventId, status);
      setEvents(events.map(ev => {
        if (ev.id === eventId) {
          const currentCount = ev.attendees_count || 0;
          const wasGoing = ev.user_attendance === 'going';
          const nowGoing = res.status === 'going';

          let updatedCount = currentCount;
          if (wasGoing && !nowGoing) updatedCount = Math.max(0, currentCount - 1);
          if (!wasGoing && nowGoing) updatedCount = currentCount + 1;

          return {
            ...ev,
            user_attendance: res.status,
            attendees_count: updatedCount
          };
        }
        return ev;
      }));
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error recording attendance' : 'Error al registrar asistencia'));
    }
  }

  async function handleCreateEventSubmit(e) {
    e.preventDefault();
    if (!title || !eventDate) return;

    try {
      await api.createEvent({
        title,
        category,
        description,
        location,
        event_date: eventDate,
        organizer,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setEventDate('');
      loadEvents();
    } catch (e) {
      alert(e.message || (language === 'en' ? 'Error creating event' : 'Error al crear evento'));
    }
  }

  const categories = language === 'en'
    ? ['All', 'Academic', 'Hackathon', 'Workshop', 'Job Fair']
    : ['Todos', 'Académico', 'Hackathon', 'Taller', 'Feria de Empleo'];

  const filteredEvents = selectedCategory === 'All' || selectedCategory === 'Todos'
    ? events
    : events.filter(e => e.category?.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="content-wrapper">
      {/* Top Banner */}
      <div className="sena-card mb-4" style={{ background: 'linear-gradient(135deg, #074C83 0%, #053b66 100%)', color: 'white' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1"><i className="bi bi-calendar-event-fill me-2"></i>{t('events.title')}</h3>
            <p className="mb-0 text-light opacity-75">
              {t('events.subtitle')}
            </p>
          </div>
          <button
            className="btn btn-light fw-bold text-primary shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-calendar-plus-fill me-2"></i>{t('events.createEventBtn')}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
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

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="sena-card text-center py-5">
          <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
          <h5>{t('events.noEvents')}</h5>
        </div>
      ) : (
        <div className="row g-4">
          {filteredEvents.map((ev) => {
            const isGoing = ev.user_attendance === 'going';
            const isInterested = ev.user_attendance === 'interested';

            return (
              <div key={ev.id} className="col-md-6 col-lg-4">
                <div className="sena-card h-100 p-0 overflow-hidden d-flex flex-column">
                  {/* Event image */}
                  <div style={{ height: 160, position: 'relative' }}>
                    <img
                      src={ev.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="badge bg-primary position-absolute top-0 end-0 m-2 shadow-sm">
                      {ev.category}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="p-4 flex-grow-1 d-flex flex-column">
                    <div className="text-danger fw-bold small mb-1">
                      <i className="bi bi-clock-fill me-1"></i>{ev.event_date}
                    </div>

                    <h5 className="fw-bold mb-2 text-dark">{ev.title}</h5>

                    <div className="text-muted small mb-2">
                      <i className="bi bi-geo-alt-fill text-secondary me-1"></i>{ev.location}
                    </div>

                    <div className="text-muted small mb-3">
                      <i className="bi bi-person-workspace text-primary me-1"></i>{language === 'en' ? 'Organized by:' : 'Organiza:'} {ev.organizer}
                    </div>

                    <p className="text-secondary small mb-3 flex-grow-1" style={{ fontSize: '0.86rem', lineHeight: '1.4' }}>
                      {ev.description}
                    </p>

                    <div className="border-top pt-3 d-flex align-items-center justify-content-between mt-auto">
                      <span className="small text-muted fw-semibold">
                        <i className="bi bi-people-fill text-primary me-1"></i>
                        {t('events.attendees', { count: ev.attendees_count || 0 })}
                      </span>

                      <div className="d-flex gap-2">
                        <button
                          className={`btn btn-sm ${isGoing ? 'btn-success text-white' : 'btn-outline-success'}`}
                          onClick={() => handleRSVP(ev.id, 'going')}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          {isGoing ? (language === 'en' ? 'Attending' : 'Asistiré') : t('events.goingBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-calendar-plus me-2 text-primary"></i>
                  {language === 'en' ? 'Schedule Academic Event' : 'Programar Evento Académico'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateEventSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">{language === 'en' ? 'Event Title:' : 'Título del Evento:'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Hackathon ADSO 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">{language === 'en' ? 'Category:' : 'Categoría:'}</label>
                      <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="Académico">{language === 'en' ? 'Academic' : 'Académico'}</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Taller">{language === 'en' ? 'Workshop' : 'Taller'}</option>
                        <option value="Feria de Empleo">{language === 'en' ? 'Job Fair' : 'Feria de Empleo'}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">{t('events.date')}:</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{t('events.location')}:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Auditorium / Classroom / Teams"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{language === 'en' ? 'Description:' : 'Descripción:'}</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder={language === 'en' ? 'Topics, requirements, mentors...' : 'Temario, requisitos, instructores participantes...'}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button type="submit" className="sena-btn-primary">
                    {language === 'en' ? 'Publish Event' : 'Publicar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
