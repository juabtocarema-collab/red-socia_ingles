import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/friends - Get all friends of current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    const [friends] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.occupation, u.origin_city, u.program, u.ficha,
              COALESCE(u.is_online, 0) AS is_online, u.last_active_at, f.created_at as friendship_date
       FROM friendships f
       JOIN users u ON (f.user_id = u.id AND f.friend_id = ?) OR (f.friend_id = u.id AND f.user_id = ?)
       WHERE f.status = 'accepted' AND u.id != ?`,
      [userId, userId, userId]
    );

    res.json(friends);
  } catch (error) {
    console.error('Error al obtener amigos:', error);
    res.status(500).json({ error: 'Error al obtener lista de amigos' });
  }
});

// GET /api/friends/requests - Pending friend requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    const [requests] = await pool.query(
      `SELECT f.id as request_id, u.id as user_id, u.username, u.full_name, u.avatar_url, u.program, u.ficha, f.created_at
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = ? AND f.status = 'pending'`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// POST /api/friends/request/:targetId - Send or add friend
router.post('/request/:targetId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = parseInt(req.params.targetId);

    if (userId === targetId) {
      return res.status(400).json({ error: 'No puedes agregarte a ti mismo como amigo' });
    }

    const pool = getPool();

    // Check if friendship exists
    const [existing] = await pool.query(
      `SELECT * FROM friendships 
       WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [userId, targetId, targetId, userId]
    );

    if (existing.length > 0) {
      return res.json({ message: 'Ya existe una solicitud o amistad con este usuario', status: existing[0].status });
    }

    // Insert friendship (accepted directly or pending)
    await pool.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
      [userId, targetId, 'accepted']
    );

    const [me] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, type, text, link)
       VALUES (?, ?, 'friend', ?, ?)`,
      [targetId, userId, `${me[0].full_name} te agregó como compañero de estudio.`, `/profile/${userId}`]
    );

    res.json({ message: '¡Aprendiz agregado exitosamente!', status: 'accepted' });
  } catch (error) {
    console.error('Error al enviar solicitud de amistad:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// DELETE /api/friends/:targetId - Remove friend
router.delete('/:targetId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = parseInt(req.params.targetId);
    const pool = getPool();

    await pool.query(
      `DELETE FROM friendships 
       WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [userId, targetId, targetId, userId]
    );

    res.json({ message: 'Amistad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar amigo:', error);
    res.status(500).json({ error: 'Error al eliminar amigo' });
  }
});

export default router;
