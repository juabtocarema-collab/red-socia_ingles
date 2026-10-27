import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const configs = [];

  // 1. TiDB Cloud if present
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      configs.push({
        name: 'TiDB Cloud',
        config: {
          host: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
          user: decodeURIComponent(parsedUrl.username),
          password: decodeURIComponent(parsedUrl.password),
          database: parsedUrl.pathname.replace(/^\//, '') || 'sena_social_db',
          ssl: { rejectUnauthorized: false }
        }
      });
    } catch (e) {
      console.warn('Could not parse DATABASE_URL:', e.message);
    }
  }

  // 2. Local MySQL
  configs.push({
    name: 'Local MySQL (127.0.0.1:3306)',
    config: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sena_social_db'
    }
  });

  for (const target of configs) {
    console.log(`\n========================================`);
    console.log(`Processing database: ${target.name}`);
    console.log(`========================================`);
    let conn;
    try {
      conn = await mysql.createConnection(target.config);

      // A. Check if status column exists in users
      const [cols] = await conn.query('DESCRIBE users');
      const hasStatus = cols.some(c => c.Field === 'status');
      if (!hasStatus) {
        console.log('-> Adding missing status column to users table...');
        await conn.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER role");
        console.log('-> status column added successfully!');
      } else {
        console.log('-> status column already exists.');
      }

      await conn.query("UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''");

      // B. Create or update admin user
      const defaultPassword = await bcrypt.hash('admin', 10);
      const [adminExists] = await conn.query("SELECT id FROM users WHERE username = 'admin' OR email = 'admin@sena.edu.co'");

      let adminId;
      if (adminExists.length === 0) {
        console.log('-> Creating official admin user...');
        const [insertRes] = await conn.query(
          `INSERT INTO users (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha, role, status, is_online)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            'admin',
            'Administrador del Sistema SENA',
            'admin@sena.edu.co',
            defaultPassword,
            25,
            'Super Administrador del Sistema',
            'Espinal, Tolima, Colombia',
            'Masculino',
            '+57 320 000 0000',
            'Español (nativo), Inglés (avanzado)',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
            '/assets/sena_campus_cover.jpg',
            'Cuenta oficial del Super Administrador de la plataforma SENA Social Network.',
            'Dirección y Administración General',
            'ADMIN-2026',
            'superadmin',
            'active'
          ]
        );
        adminId = insertRes.insertId;
        console.log(`-> Created admin user with ID: ${adminId}`);
      } else {
        adminId = adminExists[0].id;
        console.log(`-> Updating existing admin user ID: ${adminId}...`);
        await conn.query(
          "UPDATE users SET role = 'superadmin', status = 'active', password_hash = ? WHERE id = ?",
          [defaultPassword, adminId]
        );
      }

      // Ensure interests for admin
      const [intCheck] = await conn.query('SELECT id FROM interests WHERE user_id = ?', [adminId]);
      if (intCheck.length === 0) {
        await conn.query(
          `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            adminId,
            'Auditoría y Gestión de Plataformas Web en la nube.',
            'Rock clásico y música instrumental para concentrarse.',
            'Películas sobre inteligencia artificial y ciencia ficción.',
            'Documentales de ciberseguridad e innovación.',
            'Fútbol y gimnasio.',
            'Gastronomía colombiana.',
            'Café colombiano.',
            'Arquitectura de software y seguridad en redes.',
            'Cloud computing, Docker, bases de datos y desarrollo full-stack.'
          ]
        );
        console.log('-> Created interests record for admin user');
      }

      // Ensure user_settings for admin
      const [setCheck] = await conn.query('SELECT user_id FROM user_settings WHERE user_id = ?', [adminId]);
      if (setCheck.length === 0) {
        await conn.query(
          `INSERT INTO user_settings (user_id, profile_visibility, show_email, show_phone, allow_messages, notifications_enabled)
           VALUES (?, 'public', TRUE, TRUE, 'everyone', TRUE)`,
          [adminId]
        );
        console.log('-> Created settings record for admin user');
      }

      // Ensure user 1 (Juan Pablo Tocarema) is also superadmin & active
      await conn.query("UPDATE users SET role = 'superadmin', status = 'active' WHERE id = 1");
      console.log('-> User ID 1 (Juan Pablo) role confirmed as superadmin and active.');

      console.log(`[SUCCESS] Database ${target.name} is fully synchronized!`);
    } catch (err) {
      console.error(`[ERROR] Failed on database ${target.name}:`, err.message);
    } finally {
      if (conn) await conn.end();
    }
  }

  console.log('\n========================================');
  console.log('Migration finished successfully!');
  console.log('========================================\n');
}

migrate().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
