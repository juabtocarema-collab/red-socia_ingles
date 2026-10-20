import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - List user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    const [notifications] = await pool.query(
      `SELECT n.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT 30`,
      [userId]
    );

    const [unread] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      notifications,
      unread_count: unread[0].count
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al actualizar notificaciones:', error);
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

export default router;
