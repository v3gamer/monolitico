// init-db.js
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function waitForDB() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  while (true) {
    try {
      await client.connect();
      await client.end();
      console.log('✅ PostgreSQL listo');
      break;
    } catch (err) {
      console.log('⏳ Esperando a PostgreSQL...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  await waitForDB();

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL
    );
  `);

  const adminHash = await bcrypt.hash('adminpass', 10);
  const userHash = await bcrypt.hash('userpass', 10);

  await client.query(
    `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING`,
    ['admin', adminHash, 'admin'],
  );

  await client.query(
    `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING`,
    ['user', userHash, 'user'],
  );

  console.log('✅ Base de datos inicializada con usuarios de prueba');
  await client.end();
}

main();
