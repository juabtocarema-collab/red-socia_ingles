import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/posts - Get all posts for feed (or by user_id/group_id)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, group_id } = req.query;
    const currentUserId = req.user.id;
    const pool = getPool();

    let query = `
      SELECT p.*, 
             u.username, u.full_name, u.avatar_url, u.occupation, u.program, u.ficha,
             g.name AS group_name,
             (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) AS likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
             (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = ?) AS user_reaction
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_groups g ON p.group_id = g.id
      WHERE 1=1
    `;
    const params = [currentUserId];

    if (user_id) {
      query += ` AND p.user_id = ?`;
      params.push(user_id);
    }

    if (group_id) {
      query += ` AND p.group_id = ?`;
      params.push(group_id);
    }

    query += ` ORDER BY p.created_at DESC LIMIT 50`;

    const [posts] = await pool.query(query, params);

    // Fetch comments for these posts
    for (const post of posts) {
      const [comments] = await pool.query(
        `SELECT c.*, u.username, u.full_name, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC LIMIT 20`,
        [post.id]
      );
      post.comments = comments;
    }

    res.json(posts);
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
});

// POST /api/posts - Create post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, image_url, video_url, group_id, post_type } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El contenido de la publicación no puede estar vacío.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO posts (user_id, group_id, content, image_url, video_url, post_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        group_id || null,
        content.trim(),
        image_url || null,
        video_url || null,
        post_type || 'general'
      ]
    );

    const newPostId = result.insertId;

    // Fetch newly created post with user details
    const [newPostRows] = await pool.query(
      `SELECT p.*, 
              u.username, u.full_name, u.avatar_url, u.occupation, u.program, u.ficha,
              0 AS likes_count, 0 AS comments_count, NULL AS user_reaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [newPostId]
    );

    const post = newPostRows[0];
    post.comments = [];

    res.status(201).json(post);
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ error: 'Error al crear la publicación' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Publicación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ error: 'Error al eliminar publicación' });
  }
});

// POST /api/posts/:id/react - Toggle or add reaction
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { reaction_type = 'like' } = req.body;
    const pool = getPool();

    // Check if already reacted
    const [existing] = await pool.query(
      'SELECT id, reaction_type FROM reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existing.length > 0) {
      if (existing[0].reaction_type === reaction_type) {
        // Remove reaction (toggle off)
        await pool.query('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
      } else {
        // Change reaction type
        await pool.query('UPDATE reactions SET reaction_type = ? WHERE id = ?', [reaction_type, existing[0].id]);
      }
    } else {
      // Add reaction
      await pool.query(
        'INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [postId, userId, reaction_type]
      );

      // Notify post author if not self
      const [postOwner] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
      if (postOwner.length > 0 && postOwner[0].user_id !== userId) {
        const [me] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
        await pool.query(
          `INSERT INTO notifications (user_id, sender_id, type, text, link)
           VALUES (?, ?, 'reaction', ?, ?)`,
          [postOwner[0].user_id, userId, `${me[0].full_name} reaccionó a tu publicación.`, `/posts#${postId}`]
        );
      }
    }

    // Get updated counts
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM reactions WHERE post_id = ?', [postId]);
    const [userReactionRows] = await pool.query('SELECT reaction_type FROM reactions WHERE post_id = ? AND user_id = ?', [postId, userId]);

    res.json({
      likes_count: countRows[0].count,
      user_reaction: userReactionRows.length > 0 ? userReactionRows[0].reaction_type : null
    });
  } catch (error) {
    console.error('Error al reaccionar:', error);
    res.status(500).json({ error: 'Error al registrar reacción' });
  }
});

// POST /api/posts/:id/comments - Add comment
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );

    const [commentRows] = await pool.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    // Notify author
    const [postOwner] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (postOwner.length > 0 && postOwner[0].user_id !== userId) {
      const [me] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, text, link)
         VALUES (?, ?, 'comment', ?, ?)`,
        [postOwner[0].user_id, userId, `${me[0].full_name} comentó en tu publicación: "${content.trim().slice(0, 50)}..."`, `/posts#${postId}`]
      );
    }

    res.status(201).json(commentRows[0]);
  } catch (error) {
    console.error('Error al comentar:', error);
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
});

export default router;
