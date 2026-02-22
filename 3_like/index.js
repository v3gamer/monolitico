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
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

/* =========================
   INIT DB
========================= */
async function initDb() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL
    )
  `);

  console.log('✅ Like DB ready');
}

/* =========================
   ROUTES
   NOTA: Traefik StripPrefix /api/like
========================= */

// ❤️ toggle like
app.post('/toggle/:postId', async (req, res) => {
  const { postId } = req.params;
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  try {
    const exists = await client.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (exists.rows.length > 0) {
      await client.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
      );
      return res.json({ liked: false });
    }

    await client.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
      [userId, postId]
    );

    res.json({ liked: true });
  } catch (err) {
    console.error('TOGGLE LIKE ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ check like
app.get('/check/:postId', async (req, res) => {
  const { postId } = req.params;
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  try {
    const result = await client.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    res.json({ liked: result.rows.length > 0 });
  } catch (err) {
    console.error('CHECK LIKE ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔢 count likes (público)
app.get('/count/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await client.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1',
      [postId]
    );

    res.json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error('COUNT LIKE ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🗑️ delete like by id (solo su autor)
app.delete('/:id', async (req, res) => {
  const likeId = parseInt(req.params.id, 10);
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  if (isNaN(likeId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const check = await client.query(
      'SELECT id FROM likes WHERE id = $1 AND user_id = $2',
      [likeId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await client.query(
      'DELETE FROM likes WHERE id = $1',
      [likeId]
    );

    res.json({ message: 'Like eliminado' });
  } catch (err) {
    console.error('DELETE LIKE ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================
   START
========================= */
(async () => {
  try {
    await initDb();

    app.listen(port, () => {
      console.log(`✅ Like service escuchando en puerto ${port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Like service:', err);
    process.exit(1);
  }
})();
