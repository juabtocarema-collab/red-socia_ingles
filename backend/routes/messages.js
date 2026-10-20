import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/conversations - List conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Get distinct conversation partners
    const [partners] = await pool.query(
      `SELECT DISTINCT 
         CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id
       FROM messages 
       WHERE sender_id = ? OR receiver_id = ?`,
      [userId, userId, userId]
    );

    const conversations = [];

    for (const p of partners) {
      const partnerId = p.partner_id;

      // Get partner info
      const [u] = await pool.query(
        'SELECT id, username, full_name, avatar_url, occupation, program FROM users WHERE id = ?',
        [partnerId]
      );
      if (u.length === 0) continue;

      // Get last message
      const [lastMsg] = await pool.query(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1`,
        [userId, partnerId, partnerId, userId]
      );

      // Get unread count
      const [unread] = await pool.query(
        `SELECT COUNT(*) as count FROM messages 
         WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
        [partnerId, userId]
      );

      conversations.push({
        user: u[0],
        last_message: lastMsg[0] || null,
        unread_count: unread[0].count
      });
    }

    // Sort by last message date desc
    conversations.sort((a, b) => {
      const dateA = a.last_message ? new Date(a.last_message.created_at) : 0;
      const dateB = b.last_message ? new Date(b.last_message.created_at) : 0;
      return dateB - dateA;
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// GET /api/messages/:targetId - Get chat thread with target user
router.get('/:targetId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = parseInt(req.params.targetId);
    const pool = getPool();

    // Mark incoming messages as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [targetId, userId]
    );

    const [messages] = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [userId, targetId, targetId, userId]
    );

    const [partner] = await pool.query(
      'SELECT id, username, full_name, avatar_url, occupation, program FROM users WHERE id = ?',
      [targetId]
    );

    res.json({
      partner: partner[0] || null,
      messages
    });
  } catch (error) {
    console.error('Error al obtener historial de chat:', error);
    res.status(500).json({ error: 'Error al cargar mensajes' });
  }
});

// POST /api/messages/:targetId - Send message
router.post('/:targetId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = parseInt(req.params.targetId);
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, FALSE)',
      [userId, targetId, message.trim()]
    );

    const [inserted] = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    // Notify receiver
    const [me] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, type, text, link)
       VALUES (?, ?, 'message', ?, ?)`,
      [targetId, userId, `${me[0].full_name} te envió un mensaje nuevo.`, `/messages/${userId}`]
    );

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

export default router;
