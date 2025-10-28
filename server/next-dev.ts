import { spawn } from 'child_process';
import * as path from 'path';

// Start Next.js dev server
const nextDev = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: path.resolve(process.cwd()),
  stdio: 'inherit',
  shell: true,
});

nextDev.on('error', (error) => {
  console.error('[Next.js] Failed to start:', error);
});

nextDev.on('exit', (code) => {
  console.log(`[Next.js] Process exited with code ${code}`);
  process.exit(code || 0);
});

console.log('[Next.js] Starting development server on port 3000...');
