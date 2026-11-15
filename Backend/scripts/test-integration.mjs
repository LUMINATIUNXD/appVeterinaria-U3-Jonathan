// Pruebas reales sobre una base temporal. Nunca usa ni vacía veterinaria_db.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbName = `veterinaria_test_${Date.now()}`;
const port = Number(process.env.TEST_API_PORT || 3101);
const base = `http://127.0.0.1:${port}`;
const dbConfig = {
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.TEST_DB_USER || process.env.DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
  multipleStatements: true, dateStrings: true,
};
const checks = [];
let connection, server;
let serverLog = '';
const report = { fecha: new Date().toISOString(), base: 'MySQL temporal e independiente', checks };
async function start() {
  server = spawn(process.execPath, ['dist/server.js'], {
    cwd: new URL('../', import.meta.url), windowsHide: true,
    env: { ...process.env, PORT: String(port), DB_HOST: dbConfig.host, DB_PORT: String(dbConfig.port),
      DB_USER: dbConfig.user, DB_PASSWORD: dbConfig.password, DB_NAME: dbName },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  for (let n = 0; n < 80; n++) {
    if (server.exitCode !== null) throw new Error(`El servidor se detuvo: ${serverLog}`);
    if (await fetch(`${base}/api/salud`).then(r => r.ok).catch(() => false)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('El servidor no respondió a tiempo.');
}
async function stop() {
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill(); await ended; }
  server = undefined;
}
async function request(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}
async function check(name, action) {
  await action(); checks.push({ prueba: name, resultado: 'APROBADA' }); console.log(`OK: ${name}`);
}
try {
  connection = await mysql.createConnection(dbConfig);
  const [[version]] = await connection.query('SELECT VERSION() AS version');
  report.mysql = version.version;
  const sql = (await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8')).replaceAll('veterinaria_db', dbName);
  await connection.query(sql);
  await start();
  const cita = { mascota: 'Luna Prueba', cliente: 'Cliente de prueba', servicio: 'Vacunación', fecha: '2030-12-20', hora: '10:30' };
  let id;
  await check('GET: lista vacía desde MySQL', async () => {
    const r = await request('/api/citas'); assert.equal(r.status, 200); assert.deepEqual(r.data, []);
  });
  await check('POST: registro válido devuelve 201 y estado solicitada', async () => {
    const r = await request('/api/citas', 'POST', cita); assert.equal(r.status, 201);
    assert.equal(r.data.cita.estado, 'solicitada'); id = r.data.cita.id;
    report.ejemploRegistro = r;
  });
  await check('SQL: registro almacenado físicamente en MySQL', async () => {
    const [rows] = await connection.execute(`SELECT mascota, cliente, fecha, hora, estado FROM ${dbName}.citas WHERE id = ?`, [id]);
    assert.equal(rows.length, 1); assert.equal(rows[0].mascota, cita.mascota); report.consultaSql = rows;
  });
  await check('POST: horario ocupado devuelve 409', async () => { assert.equal((await request('/api/citas', 'POST', cita)).status, 409); });
  await check('POST: campos vacíos devuelven 400', async () => { assert.equal((await request('/api/citas', 'POST', {})).status, 400); });
  await check('POST: fecha inexistente devuelve 400', async () => { assert.equal((await request('/api/citas', 'POST', {...cita, fecha:'2030-02-30'})).status, 400); });
  await check('POST: hora inválida devuelve 400', async () => { assert.equal((await request('/api/citas', 'POST', {...cita, hora:'25:61'})).status, 400); });
  await check('POST: JSON mal formado devuelve 400', async () => { assert.equal((await request('/api/citas', 'POST', '{')).status, 400); });
  await check('POST: cuerpo ausente devuelve 400', async () => { assert.equal((await request('/api/citas', 'POST')).status, 400); });
  await check('PATCH: confirma cita y responde confirmada', async () => {
    const r = await request(`/api/citas/${id}/estado`, 'PATCH', {estado:'confirmada'});
    assert.equal(r.status, 200); assert.equal(r.data.cita.estado, 'confirmada');
  });
  await check('PATCH: cuerpo ausente devuelve 400', async () => { assert.equal((await request(`/api/citas/${id}/estado`, 'PATCH')).status, 400); });
  await check('GET: filtro de estado consulta MySQL', async () => { assert.equal((await request('/api/citas?estado=confirmada')).data.length, 1); });
  await check('GET: cita inexistente devuelve 404', async () => { assert.equal((await request('/api/citas/999999')).status, 404); });
  await check('Persistencia: reiniciar Express conserva la cita confirmada', async () => {
    await stop(); await start(); const r = await request(`/api/citas/${id}`);
    assert.equal(r.status, 200); assert.equal(r.data.mascota, cita.mascota); assert.equal(r.data.estado, 'confirmada');
    const [[row]] = await connection.execute(`SELECT estado FROM ${dbName}.citas WHERE id = ?`, [id]);
    assert.equal(row.estado, 'confirmada'); report.despuesDelReinicio = r;
  });
  await check('PUT: modifica y persiste el servicio', async () => {
    const r = await request(`/api/citas/${id}`, 'PUT', {...cita, servicio:'Consulta general', estado:'confirmada'});
    assert.equal(r.status, 200); assert.equal(r.data.cita.servicio, 'Consulta general');
  });
  await check('DELETE: elimina la cita de prueba', async () => {
    assert.equal((await request(`/api/citas/${id}`, 'DELETE')).status, 204);
    assert.equal((await request(`/api/citas/${id}`)).status, 404);
  });
  report.resultado = 'APROBADO';
} catch (error) {
  report.resultado = 'FALLÓ'; report.error = error.message; process.exitCode = 1; console.error(error.message);
} finally {
  await stop();
  if (connection) {
    if (!/^veterinaria_test_\d+$/.test(dbName)) throw new Error('Nombre de prueba no válido.');
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`); await connection.end();
  }
  if (process.env.TEST_REPORT) await writeFile(process.env.TEST_REPORT, JSON.stringify(report, null, 2));
  console.log(`${checks.length} pruebas aprobadas. Resultado: ${report.resultado}`);
}
