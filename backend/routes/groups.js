import express from 'express';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/groups - Get all groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    const pool = getPool();

    let query = `
      SELECT g.*, 
             u.full_name as creator_name,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member
      FROM user_groups g
      JOIN users u ON g.created_by = u.id
      WHERE 1=1
    `;
    const params = [userId];

    if (category) {
      query += ` AND g.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY members_count DESC, g.id DESC`;

    const [groups] = await pool.query(query, params);
    res.json(groups);
  } catch (error) {
    console.error('Error al listar grupos:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

// GET /api/groups/:id - Get specific group details, members, and posts
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    const [groupRows] = await pool.query(
      `SELECT g.*, u.full_name as creator_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member
       FROM user_groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = ?`,
      [userId, groupId]
    );

    if (groupRows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const group = groupRows[0];

    // Fetch members
    const [members] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.program, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.role = 'admin' DESC, gm.joined_at ASC`,
      [groupId]
    );
    group.members = members;

    // Fetch posts in this group
    const [posts] = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
              (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = ?) as user_reaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.group_id = ?
       ORDER BY p.created_at DESC`,
      [userId, groupId]
    );

    for (const p of posts) {
      const [comments] = await pool.query(
        `SELECT c.*, u.username, u.full_name, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
        [p.id]
      );
      p.comments = comments;
    }

    group.posts = posts;

    res.json(group);
  } catch (error) {
    console.error('Error al obtener grupo:', error);
    res.status(500).json({ error: 'Error al obtener detalles del grupo' });
  }
});

// POST /api/groups - Create group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category, description, cover_image, avatar_image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO user_groups (name, category, description, cover_image, avatar_image, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category || 'Programas de Formación',
        description || '',
        cover_image || '/assets/sena_campus_cover.jpg',
        avatar_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80',
        userId
      ]
    );

    const newGroupId = result.insertId;

    // Add creator as admin member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [newGroupId, userId, 'admin']
    );

    res.status(201).json({ id: newGroupId, message: 'Grupo creado exitosamente' });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// POST /api/groups/:id/join - Join group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    await pool.query(
      'INSERT IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, 'member']
    );

    res.json({ message: 'Te has unido al grupo exitosamente' });
  } catch (error) {
    console.error('Error al unirse al grupo:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
});

// POST /api/groups/:id/leave - Leave group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    await pool.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    res.json({ message: 'Has salido del grupo' });
  } catch (error) {
    console.error('Error al salir del grupo:', error);
    res.status(500).json({ error: 'Error al salir del grupo' });
  }
});

export default router;
