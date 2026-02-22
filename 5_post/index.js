const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const { Picsum } = require('picsum-photos');
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
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Post DB ready');
}

/* =========================
   ROUTES
========================= */

// ✅ CREATE POST
app.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(403).json({ error: 'Usuario no autenticado' });
    }

    const imageURL = Picsum.url();

    const result = await client.query(
      `INSERT INTO posts (image_url, content, user_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [imageURL, content, userId]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('ERROR CREATE POST:', err);
    res.status(500).json({ error: 'Error al crear post' });
  }
});

// ✅ DELETE POST
app.delete('/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const postId = parseInt(req.params.id, 10);

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    // 1️⃣ Verificar que el post pertenece al usuario
    const check = await client.query(
      'SELECT 1 FROM posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado o post no encontrado' });
    }

    // 2️⃣ Borrar post (y dependencias si existen)
    await client.query('BEGIN');

    await client.query('DELETE FROM likes WHERE post_id = $1', [postId]);
    await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);
    await client.query('DELETE FROM posts WHERE id = $1', [postId]);

    await client.query('COMMIT');

    res.json({ message: 'Post eliminado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('ERROR DELETE POST:', err);
    res.status(500).json({ error: 'Error al eliminar post' });
  }
});

/* =========================
   START
========================= */
initDb();

app.listen(port, () => {
  console.log(`✅ Post service escuchando en puerto ${port}`);
});
