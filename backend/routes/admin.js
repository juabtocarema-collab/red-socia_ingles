import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Verify Admin or Superadmin role
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
  }
  next();
}

// Apply auth + admin verification to all admin routes
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/admin/stats - Global statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();

    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ active_users }]] = await pool.query("SELECT COUNT(*) as active_users FROM users WHERE status = 'active'");
    const [[{ suspended_users }]] = await pool.query("SELECT COUNT(*) as suspended_users FROM users WHERE status = 'suspended'");
    const [[{ total_posts }]] = await pool.query('SELECT COUNT(*) as total_posts FROM users u JOIN posts p ON u.id = p.user_id');
    const [[{ total_groups }]] = await pool.query('SELECT COUNT(*) as total_groups FROM user_groups');
    const [[{ total_events }]] = await pool.query('SELECT COUNT(*) as total_events FROM events');
    const [[{ total_messages }]] = await pool.query('SELECT COUNT(*) as total_messages FROM messages');

    // Role breakdown
    const [rolesCount] = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');

    res.json({
      total_users,
      active_users,
      suspended_users,
      total_posts,
      total_groups,
      total_events,
      total_messages,
      roles: rolesCount
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de admin:', error);
    res.status(500).json({ error: 'Error al consultar estadísticas globales' });
  }
});

// GET /api/admin/users - List users with filters
router.get('/users', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const pool = getPool();

    let query = `
      SELECT u.id, u.username, u.full_name, u.email, u.role, u.status,
             u.occupation, u.origin_city, u.phone, u.program, u.ficha,
             u.avatar_url, u.created_at,
             (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
             (SELECT COUNT(*) FROM friendships WHERE (user_id = u.id OR friend_id = u.id) AND status = 'accepted') as friends_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.ficha LIKE ? OR u.program LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (role && role !== 'all') {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== 'all') {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY u.id DESC`;

    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios en admin:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// POST /api/admin/users - Create new user from admin panel
router.post('/users', async (req, res) => {
  try {
    const {
      full_name,
      username,
      email,
      password,
      role = 'aprendiz',
      status = 'active',
      occupation = 'Aprendiz SENA',
      program = 'Análisis y Desarrollo de Software',
      ficha = 'Ficha 2670142',
      origin_city = 'Espinal, Tolima',
      phone = '+57 320 000 0000',
      gender = 'Prefiero no decirlo',
      age = 18,
      bio = ''
    } = req.body;

    if (!full_name || !username || !email || !password) {
      return res.status(400).json({ error: 'Nombre, usuario, correo y contraseña son campos obligatorios.' });
    }

    const pool = getPool();

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario o correo ya existe en el sistema.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
       (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Español (nativo)', ?, '/assets/sena_campus_cover.jpg', ?, ?, ?, ?, ?)`,
      [
        username,
        full_name,
        email,
        hashedPassword,
        age,
        occupation,
        origin_city,
        gender,
        phone,
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        bio,
        program,
        ficha,
        role,
        status
      ]
    );

    const newUserId = result.insertId;

    // Create interests record
    await pool.query(
      `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
       VALUES (?, 'Formación profesional integral en el SENA.', '', '', '', '', '', '', '', '')`,
      [newUserId]
    );

    // Create settings record
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES (?)`,
      [newUserId]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
    delete newUser[0].password_hash;

    res.status(201).json({
      message: 'Usuario creado exitosamente por el administrador',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error al crear usuario por admin:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// PUT /api/admin/users/:id - Edit user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      full_name,
      username,
      email,
      role,
      status,
      occupation,
      program,
      ficha,
      origin_city,
      phone,
      bio
    } = req.body;

    const pool = getPool();

    // Verify user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check email / username conflict
    if (email || username) {
      const [conflict] = await pool.query(
        'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
        [email || '', username || '', userId]
      );
      if (conflict.length > 0) {
        return res.status(400).json({ error: 'El correo o nombre de usuario ya está asignado a otro aprendiz.' });
      }
    }

    await pool.query(
      `UPDATE users SET
        full_name = COALESCE(?, full_name),
        username = COALESCE(?, username),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        occupation = COALESCE(?, occupation),
        program = COALESCE(?, program),
        ficha = COALESCE(?, ficha),
        origin_city = COALESCE(?, origin_city),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio)
       WHERE id = ?`,
      [
        full_name,
        username,
        email,
        role,
        status,
        occupation,
        program,
        ficha,
        origin_city,
        phone,
        bio,
        userId
      ]
    );

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    delete updated[0].password_hash;

    res.json({
      message: 'Cuenta de usuario actualizada correctamente',
      user: updated[0]
    });
  } catch (error) {
    console.error('Error al editar usuario por admin:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PUT /api/admin/users/:id/status - Toggle active/suspended
router.put('/users/:id/status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body; // 'active' or 'suspended'

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes suspender tu propia cuenta de Super Administrador.' });
    }

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido. Use active o suspended.' });
    }

    const pool = getPool();
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    res.json({
      message: `Cuenta de usuario ${status === 'active' ? 'reactivada' : 'suspendida'} exitosamente.`,
      status
    });
  } catch (error) {
    console.error('Error al cambiar estado de cuenta:', error);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

// PUT /api/admin/users/:id/reset-password - Reset password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
    }

    const pool = getPool();
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Contraseña restablecida exitosamente por el administrador.' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

// DELETE /api/admin/users/:id - Delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de Super Administrador.' });
    }

    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Cuenta de usuario eliminada definitivamente de la base de datos.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/posts - Moderation of all posts
router.get('/posts', async (req, res) => {
  try {
    const pool = getPool();
    const [posts] = await pool.query(
      `SELECT p.*, u.full_name, u.username, u.program, u.email,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as likes_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json(posts);
  } catch (error) {
    console.error('Error al listar posts para moderación:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones para moderación' });
  }
});

export default router;
