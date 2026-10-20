import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import fs from 'fs';
dotenv.config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sena_social_db';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

let pool = null;

async function tryAutoStartMysql() {
  const xamppMysqlPath = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
  const xamppIniPath = 'C:\\xampp\\mysql\\bin\\my.ini';
  if (process.platform === 'win32' && fs.existsSync(xamppMysqlPath)) {
    console.log('🔄 MySQL no estaba corriendo. Intentando iniciar MySQL de XAMPP automáticamente...');
    try {
      const child = spawn(xamppMysqlPath, ['--defaults-file=' + xamppIniPath, '--standalone'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      // Wait for MySQL to initialize socket
      await new Promise(resolve => setTimeout(resolve, 3500));
      return true;
    } catch (e) {
      console.warn('No se pudo autoiniciar mysqld.exe:', e.message);
    }
  }
  return false;
}

export async function initDB() {
  const dbUrlString = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const isRemote = Boolean(dbUrlString || (DB_HOST !== '127.0.0.1' && DB_HOST !== 'localhost'));

  let poolConfig;
  if (dbUrlString) {
    try {
      const parsedUrl = new URL(dbUrlString);
      poolConfig = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: parsedUrl.pathname.replace(/^\//, '') || DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { rejectUnauthorized: false }
      };
    } catch {
      poolConfig = dbUrlString;
    }
  } else {
    poolConfig = {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: (isRemote || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined
    };
  }

  let attempts = 0;
  while (attempts < 2) {
    try {
      // 1. If local, ensure database exists
      if (!isRemote && !dbUrlString) {
        const tempConn = await mysql.createConnection({
          host: DB_HOST,
          user: DB_USER,
          password: DB_PASSWORD,
          port: DB_PORT
        });

        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await tempConn.end();
      }

      // 2. Create pool connected to database
      pool = mysql.createPool(poolConfig);

      // 3. Create tables
      await createTables();

      // 4. Seed initial data
      await seedInitialData();

      const activeDb = typeof poolConfig === 'object' ? poolConfig.database : DB_NAME;
      console.log('✅ Base de datos MySQL inicializada correctamente:', activeDb);
      return pool;
    } catch (error) {
      if (attempts === 0 && (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED'))) {
        attempts++;
        const started = await tryAutoStartMysql();
        if (started) {
          console.log('🔄 Reintentando conexión con MySQL...');
          continue;
        }
      }
      console.error('❌ Error al inicializar MySQL:', error.message);
      throw error;
    }
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDB() first.');
  }
  return pool;
}

async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      age INT DEFAULT 18,
      occupation VARCHAR(150) DEFAULT 'Aprendiz SENA',
      origin_city VARCHAR(100) DEFAULT 'Espinal, Tolima',
      gender VARCHAR(50) DEFAULT 'Masculino',
      phone VARCHAR(50) DEFAULT '+57 320 123 4567',
      languages VARCHAR(200) DEFAULT 'Español (nativo), Inglés (básico)',
      avatar_url VARCHAR(255) DEFAULT '/assets/juan_pablo_avatar.jpg',
      cover_url VARCHAR(255) DEFAULT '/assets/sena_campus_cover.jpg',
      bio TEXT,
      program VARCHAR(150) DEFAULT 'Análisis y Desarrollo de Software',
      ficha VARCHAR(50) DEFAULT 'Ficha 2670142',
      role VARCHAR(20) DEFAULT 'aprendiz',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS interests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      studies TEXT,
      music TEXT,
      movies TEXT,
      series TEXT,
      sports TEXT,
      food TEXT,
      drinks TEXT,
      books TEXT,
      games_tech TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS user_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      cover_image VARCHAR(255),
      avatar_image VARCHAR(255),
      created_by INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS group_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      role VARCHAR(20) DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_group_member (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      group_id INT DEFAULT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      video_url VARCHAR(255) DEFAULT NULL,
      post_type VARCHAR(30) DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction_type VARCHAR(20) DEFAULT 'like',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_post_reaction (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS friendships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      friend_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'accepted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_friendship (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50) DEFAULT 'Académico',
      location VARCHAR(150),
      event_date VARCHAR(100),
      organizer VARCHAR(150),
      image_url VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS event_attendees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      status VARCHAR(20) DEFAULT 'going',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_attendee (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      sender_id INT,
      type VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      link VARCHAR(255),
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS user_settings (
      user_id INT PRIMARY KEY,
      profile_visibility VARCHAR(30) DEFAULT 'public',
      show_email BOOLEAN DEFAULT TRUE,
      show_phone BOOLEAN DEFAULT TRUE,
      allow_messages VARCHAR(30) DEFAULT 'everyone',
      notifications_enabled BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`
  ];

  for (const q of queries) {
    await pool.query(q);
  }
}

async function seedInitialData() {
  const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count > 0) {
    return; // Already seeded
  }

  console.log('🌱 Sembrando datos iniciales en sena_social_db...');

  const defaultPassword = await bcrypt.hash('Sena2026*', 10);

  // 1. Create main user: Juan Pablo Tocarema Ávila (id: 1)
  const [u1] = await pool.query(
    `INSERT INTO users (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'juanpato27',
      'Juan Pablo Tocarema Ávila',
      'juanpablotocaremaavila@gmail.com',
      defaultPassword,
      18,
      'SENA Apprentice | Software Analysis and Development (ADSO)',
      'Espinal, Tolima, Colombia',
      'Male',
      '+57 320 123 4567',
      'Spanish (Native), English (Basic / Pre-intermediate)',
      '/assets/juan_pablo_avatar.jpg',
      '/assets/sena_campus_cover.jpg',
      'I am a committed and responsible SENA apprentice with a strong passion for learning. I enjoy technology, programming, and video games. My goal is to become a proficient full-stack software developer and contribute to the SENA community.',
      'Análisis y Desarrollo de Software (ADSO)',
      'Ficha 2670142'
    ]
  );
  const juanId = u1.insertId;

  // Interests for Juan Pablo in English for SENA Bilingualism Evidence
  await pool.query(
    `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      juanId,
      'I study software analysis and development, and I enjoy practicing coding and learning new technologies every day.',
      'I usually listen to salsa music when I’m happy and vallenato when I’m sad.',
      'I enjoy watching action, science fiction, and adventure movies on weekends.',
      'I love binge-watching television series like Money Heist, Stranger Things, and The Last of Us.',
      'I play soccer with my SENA classmates and I frequently go to the gym to stay healthy.',
      'My favorite Colombian food is ajiaco, and I also love eating bandeja paisa with my family.',
      'I usually drink plenty of fresh water, and I enjoy a hot cup of Colombian coffee every morning.',
      'I like reading software engineering books, tech blogs, and personal development guides.',
      'I enjoy playing strategy and adventure video games during my free time, and exploring artificial intelligence tools.'
    ]
  );

  // User Settings for Juan Pablo
  await pool.query(
    `INSERT INTO user_settings (user_id, profile_visibility, show_email, show_phone, allow_messages, notifications_enabled)
     VALUES (?, 'public', TRUE, TRUE, 'everyone', TRUE)`,
    [juanId]
  );

  // 2. Create Camila Rodríguez (id: 2)
  const [u2] = await pool.query(
    `INSERT INTO users (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'camilarodz',
      'Camila Rodríguez',
      'camila.rodriguez@sena.edu.co',
      defaultPassword,
      19,
      'Aprendiz SENA | Gestión de Redes de Datos',
      'Ibagué, Tolima',
      'Femenino',
      '+57 311 987 6543',
      'Español (nativo), Inglés (intermedio)',
      '/assets/camila_avatar.jpg',
      '/assets/sena_campus_cover.jpg',
      'Apasionada por la seguridad informática, las redes Cisco y el trabajo colaborativo en el SENA.',
      'Gestión de Redes de Datos',
      'Ficha 2670142'
    ]
  );
  const camilaId = u2.insertId;

  await pool.query(
    `INSERT INTO interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      camilaId,
      'Especializándome en ciberseguridad y arquitectura en la nube con AWS.',
      'Indie pop y rock en español.',
      'Interestelar, Matrix y The Social Network.',
      'Mr. Robot y Dark.',
      'Voleibol y natación.',
      'Lechona tolimense con arepa.',
      'Café con leche y té verde.',
      'Clean Code y novelas de suspenso.',
      'Retos CTF de hacking ético y simuladores de redes.'
    ]
  );

  await pool.query(
    `INSERT INTO user_settings (user_id, profile_visibility, show_email, show_phone, allow_messages, notifications_enabled)
     VALUES (?, 'public', TRUE, TRUE, 'everyone', TRUE)`,
    [camilaId]
  );

  // 3. Create Carlos Andrés Mendoza (id: 3)
  const [u3] = await pool.query(
    `INSERT INTO users (username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'carlos_mendoza',
      'Carlos Andrés Mendoza',
      'cmendoza@sena.edu.co',
      defaultPassword,
      20,
      'Aprendiz SENA | Animación 3D y Multimedia',
      'Bogotá D.C.',
      'Masculino',
      '+57 315 456 7890',
      'Español (nativo), Francés (básico)',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      '/assets/sena_campus_cover.jpg',
      'Modelado 3D en Blender, texturizado y diseño de videojuegos independientes.',
      'Animación 3D y Multimedia',
      'Ficha 2589011'
    ]
  );
  const carlosId = u3.insertId;

  // 4. Friendships: Juan Pablo <-> Camila (accepted), Juan Pablo <-> Carlos (accepted)
  await pool.query(
    `INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted'), (?, ?, 'accepted')`,
    [juanId, camilaId, juanId, carlosId]
  );

  // 5. User Groups
  const [g1] = await pool.query(
    `INSERT INTO user_groups (name, category, description, cover_image, avatar_image, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'ADSO - Ficha 2670142',
      'Fichas',
      'Grupo oficial de aprendices e instructores del programa Análisis y Desarrollo de Software Ficha 2670142.',
      '/assets/sena_campus_cover.jpg',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=200&q=80',
      juanId
    ]
  );
  const adsoGroupId = g1.insertId;

  const [g2] = await pool.query(
    `INSERT INTO user_groups (name, category, description, cover_image, avatar_image, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Semillero SENA de Algoritmia e Inteligencia Artificial',
      'Programas de Formación',
      'Espacio de investigación formativa para proyectos de innovación tecnológica, machine learning y cloud.',
      '/assets/sena_campus_cover.jpg',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80',
      camilaId
    ]
  );

  const [g3] = await pool.query(
    `INSERT INTO user_groups (name, category, description, cover_image, avatar_image, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Club de Videojuegos & Esports SENA',
      'Tecnología',
      'Comunidad de aprendices apasionados por el gaming competitivo, desarrollo de mods y torneos intercentros.',
      '/assets/sena_campus_cover.jpg',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
      juanId
    ]
  );

  // Join group members
  await pool.query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES 
     (?, ?, 'admin'), (?, ?, 'member'),
     (?, ?, 'admin'), (?, ?, 'member'),
     (?, ?, 'admin')`,
    [adsoGroupId, juanId, adsoGroupId, camilaId, g2.insertId, camilaId, g2.insertId, juanId, g3.insertId, juanId]
  );

  // 6. Posts
  const [p1] = await pool.query(
    `INSERT INTO posts (user_id, content, image_url, post_type)
     VALUES (?, ?, ?, ?)`,
    [
      juanId,
      '¡Hola a toda la comunidad SENA! 👋 Terminé la maqueta de nuestra nueva red social institucional. Muy emocionado por iniciar el nuevo trimestre de formación en ADSO. ¿Quién más está preparando sus entregas de fase de desarrollo?',
      '/assets/sena_campus_cover.jpg',
      'general'
    ]
  );

  const [p2] = await pool.query(
    `INSERT INTO posts (user_id, content, post_type)
     VALUES (?, ?, ?)`,
    [
      camilaId,
      'Recordatorio para los aprendices de la jornada de la mañana: Mañana a las 9:00 AM tendremos sesión virtual de acompañamiento sobre Docker y despliegue en servidores Linux. ¡No olviden repasar los comandos básicos!',
      'general'
    ]
  );

  // 7. Reactions & Comments
  await pool.query(
    `INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, 'love'), (?, ?, 'like')`,
    [p1.insertId, camilaId, p2.insertId, juanId]
  );

  await pool.query(
    `INSERT INTO comments (post_id, user_id, content) VALUES 
     (?, ?, '¡Excelente trabajo Juan Pablo! Quedó genial con los colores del SENA.'),
     (?, ?, 'Muchas gracias Camila, la idea es que todos los aprendices la usemos.')`,
    [p1.insertId, camilaId, p1.insertId, juanId]
  );

  // 8. Academic Events
  await pool.query(
    `INSERT INTO events (title, description, category, location, event_date, organizer, image_url) VALUES 
     (?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Hackathon SENASoft 2026 - Convocatoria Nacional',
      'Competencia de desarrollo de software, robótica y ciberseguridad abierta para todos los aprendices del país. ¡Premios y vinculación laboral!',
      'Hackathon',
      'Centro de Formación - Auditorio Principal y Virtual',
      '28 de Octubre, 08:00 AM',
      'Dirección General SENA & TecnoParque',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',

      'Feria de Proyectos de Innovación y Desarrollo',
      'Muestra de proyectos productivos desarrollados por los aprendices de la ficha 2670142. Presentación ante empresarios de la región.',
      'Académico',
      'Plaza Central de la Sede',
      '5 de Noviembre, 10:00 AM',
      'Coordinación Académica ADSO',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',

      'Taller Práctico: Git, GitHub y Flujos CI/CD en la Nube',
      'Aprende a gestionar repositorios profesionales, resolver conflictos de merge y desplegar aplicaciones web con GitHub Actions.',
      'Taller',
      'Laboratorio de Computación 302',
      '12 de Noviembre, 02:00 PM',
      'Semillero de Software Libre',
      'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=800&q=80'
    ]
  );

  // 9. Messages between Camila and Juan Pablo (3 messages so badge says 3)
  await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES 
     (?, ?, 'Hola Juan Pablo! ¿Ya revisaste el cronograma de la entrega de la ficha?', FALSE),
     (?, ?, 'También quería preguntarte si vas a participar en la Hackathon de SENASoft', FALSE),
     (?, ?, 'Avisa para armar el equipo de ADSO!', FALSE)`,
    [camilaId, juanId, camilaId, juanId, camilaId, juanId]
  );

  // 10. Notification for Juan Pablo (badge: 1)
  await pool.query(
    `INSERT INTO notifications (user_id, sender_id, type, text, link, is_read) VALUES 
     (?, ?, 'comment', 'Camila Rodríguez comentó en tu publicación: "¡Excelente trabajo Juan Pablo! Quedó genial con los colores del SENA."', '/posts', FALSE)`,
    [juanId, camilaId]
  );

  console.log('✅ Datos iniciales sembrados exitosamente.');
}
