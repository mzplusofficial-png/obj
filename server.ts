import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { initAdmin, sendPush } from './notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase for manifest route
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E_rpgEr5_Vf1_1wkLBGKNQ_hxvfdeED';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dynamic Icon Route
  app.get('/icon.png', async (req, res) => {
    try {
      const { data } = await supabase.from('mz_app_config').select('icon_base64').eq('id', 'main-config').maybeSingle();
      if (data?.icon_base64) {
        const base64Data = data.icon_base64.split(',')[1];
        if (base64Data) {
          const img = Buffer.from(base64Data, 'base64');
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Length', img.length);
          res.send(img);
          return;
        }
      }
      res.redirect('https://ui-avatars.com/api/?name=MZ&background=ca8a04&color=fff&size=512&format=png');
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // Dynamic Manifest Route
  app.get('/manifest.json', async (req, res) => {
    try {
      const { data } = await supabase.from('mz_app_config').select('*').eq('id', 'main-config').maybeSingle();
      
      const customName = data?.app_name || 'MZ+ Elite';
      // Use the stable route for icons instead of raw base64 for better compatibility
      const iconUrl = '/icon.png?v=' + (data?.updated_at ? new Date(data.updated_at).getTime() : Date.now());

      const manifest = {
        "id": "mz-plus-elite-system",
        "name": customName,
        "short_name": customName.substring(0, 12),
        "description": "Système Élite - " + customName,
        "icons": [
          {
            "src": iconUrl,
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": iconUrl,
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#ca8a04",
        "scope": "/",
        "gcm_sender_id": "627912091228"
      };

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(manifest));
    } catch (error) {
      console.error('Manifest generation error:', error);
      // Fallback a un manifest statique en cas d'erreur
      res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
    }
  });

  initAdmin();

  // API Route to send real FCM Push (using the new service)
  app.post('/api/send-push', async (req, res) => {
    const { token, title, body, url, icon } = req.body;

    try {
      if (!token) {
        return res.status(400).json({ error: 'Token manquant' });
      }

      const result = await sendPush(token, title, body, { url, icon });

      if (!result.success) {
        if (result.error === 'invalid_token') {
          console.log(`Cleaning up invalid token: ${token}`);
          // Ici vous pouvez ajouter la logique pour supprimer le token de la DB Supabase
          // await supabase.from('users').update({ fcm_token: null }).eq('fcm_token', token);
        }
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('API Send-Push Error:', error);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
