import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth';
import inventoryRoutes from './server/routes/inventory';
import ordersRoutes from './server/routes/orders';
import aiRoutes from './server/routes/ai';
import { db } from './server/db';
import { startInventoryCron } from './server/inventoryCron';
import { setupWebSocketServer } from './server/realtime';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Setup WebSocket Realtime layer
  setupWebSocketServer(server);

  app.use(express.json());

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Recent simulated and sent emails (for preview test sandbox)
  app.get('/api/emails/recent', (req, res) => {
    const logs = db.emailLogs.find();
    res.json({ logs });
  });

  // Public pizzas catalog endpoint (PRD Page 3 specification)
  app.get('/api/pizzas', (req, res) => {
    const pizzas = db.catalog.find();
    res.json({ pizzas });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/ai', aiRoutes);

  // Initialize node-cron automated inventory stock monitor (< 20 threshold check)
  startInventoryCron();

  // Vite middleware setup
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🍕 PizzaCraft Artisan Platform running on http://0.0.0.0:${PORT} (with Real-Time WebSocket)`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
