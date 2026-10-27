import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import friendRoutes from './routes/friends.js';
import groupRoutes from './routes/groups.js';
import messageRoutes from './routes/messages.js';
import eventRoutes from './routes/events.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/public/assets')));

// Serve built React frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'My Social Network - SENA Backend API', time: new Date() });
});

// Supabase status endpoint
app.get('/api/supabase-status', async (req, res) => {
  try {
    const { supabase } = await import('./config/supabase.js');
    res.json({
      status: 'connected',
      supabase_url: process.env.SUPABASE_URL,
      publishable_key_set: !!process.env.SUPABASE_PUBLISHABLE_KEY,
      jwks_url: process.env.SUPABASE_JWKS_URL,
      sdk: '@supabase/server + @supabase/supabase-js'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// SPA Fallback: send index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Start server
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor backend SENA corriendo en http://0.0.0.0:${PORT} (Red Local accesible)`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor backend:', error.message);
    process.exit(1);
  }
}

startServer();
