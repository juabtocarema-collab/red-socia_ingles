-- ==============================================================================
-- SCHEMA & SEED DATA FOR SUPABASE (PostgreSQL) - MY SOCIAL NETWORK SENA
-- Copia y pega todo este contenido directamente en el SQL Editor de Supabase y haz clic en RUN.
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
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
  status VARCHAR(20) DEFAULT 'active',
  is_online BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Interests Table
CREATE TABLE IF NOT EXISTS public.interests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  studies TEXT,
  music TEXT,
  movies TEXT,
  series TEXT,
  sports TEXT,
  food TEXT,
  drinks TEXT,
  books TEXT,
  games_tech TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Groups Table
CREATE TABLE IF NOT EXISTS public.user_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image VARCHAR(255),
  avatar_image VARCHAR(255),
  created_by INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- 5. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id INT REFERENCES public.user_groups(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  video_url VARCHAR(255) DEFAULT NULL,
  post_type VARCHAR(30) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- 9. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'Académico',
  location VARCHAR(150),
  event_date VARCHAR(100),
  organizer VARCHAR(150),
  image_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Event Attendees Table
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'going',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id INT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(30) DEFAULT 'public',
  show_email BOOLEAN DEFAULT TRUE,
  show_phone BOOLEAN DEFAULT TRUE,
  allow_messages VARCHAR(30) DEFAULT 'everyone',
  notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Permisos y políticas para Supabase (permitir acceso completo tanto a usuarios anónimos como autenticados)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Habilitar RLS con política permisiva para todas las tablas
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- ==============================================================================
-- DATOS INICIALES (SEMILLAS)
-- Contraseña por defecto para todos: Sena2026* y admin
-- ==============================================================================

-- 1. Usuarios Oficiales
INSERT INTO public.users (id, username, full_name, email, password_hash, age, occupation, origin_city, gender, phone, languages, avatar_url, cover_url, bio, program, ficha, role, status)
VALUES
(
  1,
  'admin',
  'Administrador del Sistema SENA',
  'admin@sena.edu.co',
  '$2a$10$w00K0/Oeq7LgJiqd8J8Dq.fJqQoFpZkHwK8HnJq6XqXqXqXqXqXqX',
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
),
(
  2,
  'juanpato27',
  'Juan Pablo Tocarema Ávila',
  'juanpablotocaremaavila@gmail.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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
  'Ficha 2670142',
  'superadmin',
  'active'
),
(
  3,
  'camilarodz',
  'Camila Rodríguez',
  'camila.rodriguez@sena.edu.co',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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
  'Ficha 2670142',
  'aprendiz',
  'active'
),
(
  4,
  'carlos_mendoza',
  'Carlos Andrés Mendoza',
  'cmendoza@sena.edu.co',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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
  'Ficha 2589011',
  'aprendiz',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Actualizar secuencia de IDs de usuarios
SELECT setval('users_id_seq', (SELECT MAX(id) FROM public.users));

-- 2. Intereses
INSERT INTO public.interests (user_id, studies, music, movies, series, sports, food, drinks, books, games_tech)
VALUES
(
  1,
  'Auditoría y Gestión de Plataformas Web en la nube.',
  'Rock clásico y música instrumental para concentrarse.',
  'Películas sobre inteligencia artificial y ciencia ficción.',
  'Documentales de ciberseguridad e innovación.',
  'Fútbol y gimnasio.',
  'Gastronomía colombiana.',
  'Café colombiano.',
  'Arquitectura de software y seguridad en redes.',
  'Cloud computing, Docker, bases de datos y desarrollo full-stack.'
),
(
  2,
  'I study software analysis and development, and I enjoy practicing coding and learning new technologies every day.',
  'I usually listen to salsa music when I’m happy and vallenato when I’m sad.',
  'I enjoy watching action, science fiction, and adventure movies on weekends.',
  'I love binge-watching television series like Money Heist, Stranger Things, and The Last of Us.',
  'I play soccer with my SENA classmates and I frequently go to the gym to stay healthy.',
  'My favorite Colombian food is ajiaco, and I also love eating bandeja paisa with my family.',
  'I usually drink plenty of fresh water, and I enjoy a hot cup of Colombian coffee every morning.',
  'I like reading software engineering books, tech blogs, and personal development guides.',
  'I enjoy playing strategy and adventure video games during my free time, and exploring artificial intelligence tools.'
),
(
  3,
  'Especializándome en ciberseguridad y arquitectura en la nube con AWS.',
  'Indie pop y rock en español.',
  'Interestelar, Matrix y The Social Network.',
  'Mr. Robot y Dark.',
  'Voleibol y natación.',
  'Lechona tolimense con arepa.',
  'Café con leche y té verde.',
  'Clean Code y novelas de suspenso.',
  'Retos CTF de hacking ético y simuladores de redes.'
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Configuración de Usuarios
INSERT INTO public.user_settings (user_id, profile_visibility, show_email, show_phone, allow_messages, notifications_enabled)
VALUES
  (1, 'public', TRUE, TRUE, 'everyone', TRUE),
  (2, 'public', TRUE, TRUE, 'everyone', TRUE),
  (3, 'public', TRUE, TRUE, 'everyone', TRUE),
  (4, 'public', TRUE, TRUE, 'everyone', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Grupos SENA
INSERT INTO public.user_groups (id, name, category, description, cover_image, avatar_image, created_by)
VALUES
(
  1,
  'ADSO - Ficha 2670142',
  'Fichas',
  'Grupo oficial de aprendices e instructores del programa Análisis y Desarrollo de Software Ficha 2670142.',
  '/assets/sena_campus_cover.jpg',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=200&q=80',
  2
),
(
  2,
  'Semillero Bilingüismo SENA (English Club)',
  'Idiomas',
  'Space dedicated to practicing conversational English, vocabulary, and grammar through interactive activities.',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80',
  2
),
(
  3,
  'Comunidad de Ciberseguridad SENA',
  'Tecnología',
  'Espacio de investigación en seguridad ofensiva, análisis forense digital y buenas prácticas de protección de datos.',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&q=80',
  3
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('user_groups_id_seq', (SELECT MAX(id) FROM public.user_groups));

-- 5. Publicaciones Iniciales
INSERT INTO public.posts (id, user_id, group_id, content, image_url, post_type)
VALUES
(
  1,
  2,
  1,
  'Hello everyone! Welcome to our SENA Bilingual Social Network. This platform was created as part of our English Evidence project, combining modern Full-Stack web development with professional bilingual communication. Feel free to explore my profile, check out my hobbies, and leave a comment in English! 🇨🇴 🇬🇧 💻',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'general'
),
(
  2,
  3,
  2,
  '¡Hola compañeros! Hoy iniciamos una nueva sesión del English Club en el SENA. Estaremos practicando pronunciación y fluidez técnica para entrevistas de software. ¡Todos los aprendices son bienvenidos!',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'academic'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('posts_id_seq', (SELECT MAX(id) FROM public.posts));

-- 6. Amistades Iniciales
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES
  (2, 3, 'accepted'),
  (3, 2, 'accepted'),
  (2, 4, 'accepted'),
  (4, 2, 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;
