import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events - List events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    const pool = getPool();

    let query = `
      SELECT e.*,
             (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status = 'going') as attendees_count,
             (SELECT status FROM event_attendees WHERE event_id = e.id AND user_id = ?) as user_attendance
      FROM events e
      WHERE 1=1
    `;
    const params = [userId];

    if (category) {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY e.id ASC`;

    const [events] = await pool.query(query, params);
    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// POST /api/events/:id/attend - Toggle RSVP
router.post('/:id/attend', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { status = 'going' } = req.body;
    const pool = getPool();

    const [existing] = await pool.query(
      'SELECT id, status FROM event_attendees WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === status) {
        // Remove attendance
        await pool.query('DELETE FROM event_attendees WHERE id = ?', [existing[0].id]);
        return res.json({ status: null, message: 'Cancelaste tu asistencia al evento.' });
      } else {
        await pool.query('UPDATE event_attendees SET status = ? WHERE id = ?', [status, existing[0].id]);
        return res.json({ status, message: `Estado actualizado a: ${status === 'going' ? 'Asistiré' : 'Me interesa'}` });
      }
    } else {
      await pool.query(
        'INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)',
        [eventId, userId, status]
      );
      return res.json({ status, message: `¡Confirmaste que ${status === 'going' ? 'asistirás' : 'te interesa'} este evento!` });
    }
  } catch (error) {
    console.error('Error al actualizar asistencia a evento:', error);
    res.status(500).json({ error: 'Error al procesar asistencia al evento' });
  }
});

// POST /api/events - Create new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, location, event_date, organizer, image_url } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Título y fecha son requeridos' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO events (title, description, category, location, event_date, organizer, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        category || 'Académico',
        location || 'Centro de Formación SENA',
        event_date,
        organizer || 'Comunidad SENA',
        image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Evento creado exitosamente' });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

export default router;
