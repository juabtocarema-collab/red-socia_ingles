import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      full_name,
      email,
      password,
      age,
      occupation,
      origin_city,
      gender,
      phone,
      languages,
      bio,
      program,
      ficha
    } = req.body;

    if (!username || !full_name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, usuario, correo y contraseña son obligatorios.' });
    }

    const pool = getPool();

    // Check if user or email exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El usuario o el correo electrónico ya se encuentran registrados.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
       (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, bio, program, ficha, is_online, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        username,
        full_name,
        email,
        hashedPassword,
        age || 18,
        occupation || 'Aprendiz SENA',
        origin_city || 'Colombia',
        gender || 'Prefiero no decirlo',
        phone || '',
        languages || 'Español',
        bio || '',
        program || 'Análisis y Desarrollo de Software',
        ficha || ''
      ]
    );

    const newUserId = result.insertId;

    // Create empty default interests record
    await pool.query(
      `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
       VALUES (?, '', '', '', '', '', '', '', '', '')`,
      [newUserId]
    );

    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES (?)`,
      [newUserId]
    );

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
    const user = userRows[0];
    delete user.password_hash;
    user.is_online = 1;

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registro exitoso en My Social Network - SENA',
      user,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be username or email

    if (!login || !password) {
      return res.status(400).json({ error: 'Por favor ingresa usuario/correo y contraseña.' });
    }

    const pool = getPool();
    const cleanLogin = login.trim().toLowerCase();
    const isAdminAlias = ['admin', 'superadmin', 'admin@sena.edu.co', 'administrador', 'root'].includes(cleanLogin);

    const [users] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
      [cleanLogin, cleanLogin]
    );

    let user;
    if (users.length === 0) {
      if (isAdminAlias) {
        // Fallback to official admin user in the database
        let [superadmins] = await pool.query(
          "SELECT * FROM users WHERE username = 'admin' LIMIT 1"
        );
        if (superadmins.length === 0) {
          [superadmins] = await pool.query("SELECT * FROM users WHERE role = 'superadmin' OR role = 'admin' ORDER BY id DESC LIMIT 1");
        }
        if (superadmins.length > 0) {
          user = superadmins[0];
        } else {
          return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo o usuario.' });
        }
      } else {
        return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo o usuario.' });
      }
    } else {
      user = users[0];
    }

    // Password check with master keys for admin accounts
    let isMatch = false;
    const isUserAdmin = user.role === 'superadmin' || user.role === 'admin' || isAdminAlias;

    if (isUserAdmin) {
      const allowedAdminPasswords = ['admin', 'admin123', 'sena2026*', 'admin2026', '123456', 'superadmin', 'sena'];
      if (allowedAdminPasswords.includes(password.toLowerCase().trim())) {
        isMatch = true;
      } else {
        isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // Set user online
    await pool.query('UPDATE users SET is_online = 1, last_active_at = NOW() WHERE id = ?', [user.id]);
    user.is_online = 1;

    delete user.password_hash;

    // Fetch interests
    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [user.id]);
    user.interests = interests[0] || {};

    const token = generateToken(user);

    res.json({
      message: 'Inicio de sesión exitoso',
      user,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
});

// POST /api/auth/demo/:id - Fast demo login with authentic token
router.post('/demo/:id', async (req, res) => {
  try {
    const pool = getPool();
    const idParam = req.params.id;
    let users;

    if (idParam === 'admin' || idParam === 'superadmin') {
      [users] = await pool.query(
        "SELECT * FROM users WHERE username = 'admin' LIMIT 1"
      );
      if (users.length === 0) {
        [users] = await pool.query("SELECT * FROM users WHERE role = 'superadmin' OR role = 'admin' ORDER BY id DESC LIMIT 1");
      }
    } else {
      [users] = await pool.query('SELECT * FROM users WHERE id = ?', [idParam]);
    }

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    await pool.query('UPDATE users SET is_online = 1, last_active_at = NOW() WHERE id = ?', [user.id]);
    user.is_online = 1;
    delete user.password_hash;

    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [user.id]);
    user.interests = interests[0] || {};

    const token = generateToken(user);
    res.json({
      message: `Conectado como ${user.full_name}`,
      user,
      token
    });
  } catch (error) {
    console.error('Error en demo login:', error);
    res.status(500).json({ error: 'Error al cambiar usuario' });
  }
});

// POST /api/auth/admin-quick-login - Instant 1-click admin login
router.post('/admin-quick-login', async (req, res) => {
  try {
    const pool = getPool();
    let [users] = await pool.query(
      "SELECT * FROM users WHERE username = 'admin' LIMIT 1"
    );
    if (users.length === 0) {
      [users] = await pool.query(
        "SELECT * FROM users WHERE role = 'superadmin' OR role = 'admin' ORDER BY id DESC LIMIT 1"
      );
    }

    if (users.length === 0) {
      return res.status(404).json({ error: 'Cuenta de administrador no disponible.' });
    }

    const user = users[0];
    await pool.query('UPDATE users SET is_online = 1, last_active_at = NOW() WHERE id = ?', [user.id]);
    user.is_online = 1;
    delete user.password_hash;

    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [user.id]);
    user.interests = interests[0] || {};

    const token = generateToken(user);
    res.json({
      message: `Sesión de Administrador iniciada: ${user.full_name}`,
      user,
      token
    });
  } catch (error) {
    console.error('Error en admin quick login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión de administrador.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE users SET is_online = 0 WHERE id = ?', [req.user.id]);
    res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
});

// POST /api/auth/heartbeat
router.post('/heartbeat', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE users SET is_online = 1, last_active_at = NOW() WHERE id = ?', [req.user.id]);
    res.json({ status: 'active' });
  } catch (error) {
    res.status(500).json({ error: 'Error en heartbeat' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    // Update active timestamp
    await pool.query('UPDATE users SET is_online = 1, last_active_at = NOW() WHERE id = ?', [req.user.id]);

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    delete user.password_hash;
    user.is_online = 1;

    const [interests] = await pool.query('SELECT * FROM interests WHERE user_id = ?', [user.id]);
    user.interests = interests[0] || {};

    const [settings] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [user.id]);
    user.settings = settings[0] || {};

    res.json(user);
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
});

export default router;
