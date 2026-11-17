import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/server/createApp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = process.env.NODE_ENV === 'production' ? Number(process.env.PORT) || 3000 : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`EmagreSLIM server listening on http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start EmagreSLIM server:', err);
  process.exit(1);
});
