import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

const children = [];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function launch(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', (error) => { console.error(error.message); stop(1); });
  child.on('exit', (code) => { if (!closing) stop(code ?? 1); });
  return child;
}
try {
  for (const port of [3000, 5173]) {
    const probe = net.createServer().listen(port);
    await once(probe, 'listening');
    await new Promise((resolve) => probe.close(resolve));
  }
  launch(['dist/server.js'], new URL('../Backend/', import.meta.url));
  for (let attempt = 0; attempt < 50; attempt++) {
    if (closing) throw new Error('El backend no pudo arrancar.');
    const ready = await fetch('http://localhost:3000/api/salud').then(r => r.ok).catch(() => false);
    if (ready) break;
    if (attempt === 49) throw new Error('El backend no respondió a tiempo.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!closing) launch(['node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', '5173', '--strictPort', '--open'], new URL('../', import.meta.url));
  console.log('Deja esta ventana abierta. Para detener la app, presiona Ctrl+C.');
} catch (error) {
  console.error('No se pudo iniciar:', error.message);
  console.error('Si el puerto 3000 o 5173 está ocupado, cierra la otra copia de la app.');
  stop(1);
}
