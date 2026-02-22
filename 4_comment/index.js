const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 🔌 conexión a Postgres
const client = new Client({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

// 🗄️ init DB (SOLO comments)
async function initDb() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Comments DB ready');
}

/* =========================
   ROUTES
========================= */

// 📥 GET comments por post
app.get('/:postId', async (req, res) => {
  try {
    const result = await client.query(
      `
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE post_id = $1
      ORDER BY date_created DESC
      `,
      [req.params.postId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET COMMENTS ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ➕ POST crear comment
app.post('/', async (req, res) => {
  const { content, postId } = req.body;
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  if (!content || !postId) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const result = await client.query(
      `
      INSERT INTO comments (content, user_id, post_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [content, userId, postId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('CREATE COMMENT ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🗑️ DELETE comment (solo su autor)
app.delete('/:id', async (req, res) => {
  const commentId = parseInt(req.params.id, 10);
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(403).json({ error: 'Usuario no autenticado' });
  }

  if (isNaN(commentId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const check = await client.query(
      'SELECT id FROM comments WHERE id = $1 AND user_id = $2',
      [commentId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado o comentario no encontrado' });
    }

    await client.query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );

    res.json({ message: 'Comentario eliminado' });
  } catch (err) {
    console.error('DELETE COMMENT ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🚀 arrancar
initDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Comment service running on port ${port}`);
  });
});
