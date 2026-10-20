import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - List users / search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, program, ficha } = req.query;
    const pool = getPool();

    let query = `
      SELECT u.id, u.username, u.full_name, u.occupation, u.origin_city, 
             u.program, u.ficha, u.avatar_url, u.cover_url, u.bio,
             COALESCE(u.is_online, 0) AS is_online,
             u.last_active_at,
             (SELECT COUNT(*) FROM friendships WHERE (user_id = u.id OR friend_id = u.id) AND status = 'accepted') AS friends_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.program LIKE ? OR u.origin_city LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (program) {
      query += ` AND u.program LIKE ?`;
      params.push(`%${program}%`);
    }

    if (ficha) {
      query += ` AND u.ficha LIKE ?`;
      params.push(`%${ficha}%`);
    }

    query += ` ORDER BY u.id ASC LIMIT 50`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/users/:id - Get full profile + interests
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const pool = getPool();

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    delete user.password_hash;

    // Fetch interests
    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [userId]);
    user.interests = interests[0] || {
      studies: '',
      music: '',
      movies: '',
      series: '',
      sports: '',
      food: '',
      drinks: '',
      books: '',
      games_tech: ''
    };

    // Count friends
    const [friendCount] = await pool.query(
      `SELECT COUNT(*) as count FROM friendships 
       WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'`,
      [userId, userId]
    );
    user.friends_count = friendCount[0].count;

    // Check friendship status with current logged in user
    if (req.user && req.user.id !== parseInt(userId)) {
      const [friendship] = await pool.query(
        `SELECT status FROM friendships 
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
        [req.user.id, userId, userId, req.user.id]
      );
      user.friendship_status = friendship.length > 0 ? friendship[0].status : 'none';
    } else {
      user.friendship_status = 'self';
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// PUT /api/users/:id - Update personal profile information
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
    }

    const {
      full_name,
      age,
      occupation,
      origin_city,
      gender,
      phone,
      languages,
      bio,
      avatar_url,
      cover_url,
      program,
      ficha
    } = req.body;

    const pool = getPool();

    await pool.query(
      `UPDATE users SET 
        full_name = COALESCE(?, full_name),
        age = COALESCE(?, age),
        occupation = COALESCE(?, occupation),
        origin_city = COALESCE(?, origin_city),
        gender = COALESCE(?, gender),
        phone = COALESCE(?, phone),
        languages = COALESCE(?, languages),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        cover_url = COALESCE(?, cover_url),
        program = COALESCE(?, program),
        ficha = COALESCE(?, ficha)
       WHERE id = ?`,
      [
        full_name,
        age,
        occupation,
        origin_city,
        gender,
        phone,
        languages,
        bio,
        avatar_url,
        cover_url,
        program,
        ficha,
        userId
      ]
    );

    // Return updated user
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = rows[0];
    delete updatedUser.password_hash;

    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [userId]);
    updatedUser.interests = interests[0] || {};

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// PUT /api/users/:id/interests - Update interests categories
router.put('/:id/interests', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar estos intereses' });
    }

    const {
      studies,
      music,
      movies,
      series,
      sports,
      food,
      drinks,
      books,
      games_tech
    } = req.body;

    const pool = getPool();

    // Check if interest row exists
    const [existing] = await pool.query('SELECT id FROM interests WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, studies || '', music || '', movies || '', series || '', sports || '', food || '', drinks || '', books || '', games_tech || '']
      );
    } else {
      await pool.query(
        `UPDATE interests SET
          studies = ?,
          music = ?,
          movies = ?,
          series = ?,
          sports = ?,
          food = ?,
          drinks = ?,
          books = ?,
          games_tech = ?
         WHERE user_id = ?`,
        [
          studies !== undefined ? studies : '',
          music !== undefined ? music : '',
          movies !== undefined ? movies : '',
          series !== undefined ? series : '',
          sports !== undefined ? sports : '',
          food !== undefined ? food : '',
          drinks !== undefined ? drinks : '',
          books !== undefined ? books : '',
          games_tech !== undefined ? games_tech : '',
          userId
        ]
      );
    }

    const [updated] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [userId]);
    res.json({
      message: 'Intereses actualizados correctamente',
      interests: updated[0]
    });
  } catch (error) {
    console.error('Error al actualizar intereses:', error);
    res.status(500).json({ error: 'Error al actualizar intereses' });
  }
});

// PUT /api/users/:id/settings - Update privacy settings
router.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { profile_visibility, show_email, show_phone, allow_messages, notifications_enabled } = req.body;
    const pool = getPool();

    await pool.query(
      `INSERT INTO user_settings (user_id, profile_visibility, show_email, show_phone, allow_messages, notifications_enabled)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        profile_visibility = VALUES(profile_visibility),
        show_email = VALUES(show_email),
        show_phone = VALUES(show_phone),
        allow_messages = VALUES(allow_messages),
        notifications_enabled = VALUES(notifications_enabled)`,
      [
        userId,
        profile_visibility || 'public',
        show_email ?? true,
        show_phone ?? true,
        allow_messages || 'everyone',
        notifications_enabled ?? true
      ]
    );

    res.json({ message: 'Configuraciones de privacidad guardadas exitosamente' });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración' });
  }
});

export default router;
