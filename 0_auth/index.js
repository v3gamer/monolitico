const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Client } = require('pg');

const app = express();
const port = 3000;
const JWT_SECRET = 'secretkey';

/* =========================
   Middlewares base
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/* =========================
   Vistas
========================= */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* =========================
   Postgres
========================= */
const client = new Client({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

/* =========================
   Inicializar BD
========================= */
async function initDb() {
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        post_id INTEGER REFERENCES posts(id),
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        post_id INTEGER REFERENCES posts(id)
      )
    `);

    console.log('✅ Tablas verificadas');
  } catch (err) {
    console.error('❌ Error inicializando BD:', err);
  }
}


/* =========================
get verify 
========================= */
app.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('❌ No Authorization header');
    return res.sendStatus(401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('❌ Authorization mal formado');
    return res.sendStatus(401);
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.sendStatus(403);
    }

    res.setHeader('x-user-id', decoded.id.toString());
    res.setHeader('x-user-name', decoded.username);
    res.setHeader('x-user-role', decoded.role);

    console.log('✅ Token OK:', decoded.username);
    return res.sendStatus(200);
  });
});



/* =========================
   API AUTH
========================= */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('❌ Error login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/* =========================
   Start server
========================= */
initDb();
// Servidor
app.listen(port, () => {
  console.log(`✅ Servidor escuchando en puerto ${port}`);
  console.log('Usuarios de prueba: admin/adminpass y user/userpass');
});
