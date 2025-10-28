/**
 * Custom Next.js server that wraps the existing Express app
 * This allows us to run both Next.js AND Express routes simultaneously
 */

import next from 'next';
import { parse } from 'url';
import express from 'express';
import { createExpressApp } from './express-app.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 5000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    // Prepare Next.js
    await app.prepare();
    console.log('[Next.js] App prepared');

    // Create the Express app (existing implementation)
    const expressApp = await createExpressApp();
    console.log('[Express] App created');

    // Mount Express under /api/express/* to handle legacy routes
    const wrapper = express();
    wrapper.use('/api/express', expressApp);

    // Handle all other requests with Next.js
    wrapper.all('*', (req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    wrapper.listen(port, hostname, () => {
      console.log(`[Server] Ready on http://${hostname}:${port}`);
      console.log(`[Next.js] Handling most routes`);
      console.log(`[Express] Mounted at /api/express/*`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
