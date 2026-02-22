const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

/* =========================
   DB
========================= */
const client = new Client({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

/* =========================
   INIT DB
========================= */
async function initDb() {
  try {
    await client.connect();
    console.log('✅ DB conectada (public_post_service)');

    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        data_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Asegurar que la columna exista (soluciona tu error)
    await client.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS data_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('✅ Post DB ready');

  } catch (err) {
    console.error('❌ Error conectando a DB:', err.message);
    process.exit(1);
  }
}

/* =========================
   ROUTES
========================= */

// GET POSTS
app.get('/', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT posts.id, posts.image_url, posts.content, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.data_created DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error GET /posts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START
========================= */
initDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Post service en ${port}`);
  });
});