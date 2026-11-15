import mysql from 'mysql2/promise';
import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const database = process.env.DB_NAME || 'veterinaria_db';
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Nombre de base no válido.');
let connection;
try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const sql = (await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8')).replaceAll('veterinaria_db', database);
  await connection.query(sql);
  console.log('Base de datos y tabla listas. Se conservaron los registros existentes.');
} catch (error) {
  console.error('No se pudo preparar MySQL:', error.code || error.message);
  console.error('Comprueba que MySQL esté iniciado y que el usuario y la contraseña sean correctos.');
  process.exitCode = 1;
} finally {
  await connection?.end();
}
