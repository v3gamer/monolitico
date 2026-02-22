const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { Client } = require('pg');

const app = express();
const port = 3000;

/* =========================
   Middlewares base
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

    console.log('✅ Users DB ready');
  } catch (err) {
    console.error('❌ Error inicializando BD:', err);
  }
}

/* =========================
   Auth middlewares (HEADERS)
========================= */
function isAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role === 'admin') return next();
  return res.status(403).send('No autorizado');
}

function isUser(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role === 'user' || role === 'admin') return next();
  return res.status(403).send('No autorizado');
}

/* =========================
   Rutas vistas
========================= */
app.get('/', (_, res) => res.render('login'));
app.get('/register', (_, res) => res.render('register'));

app.get('/home', isUser, (req, res) =>
  res.render('home', { user: req.headers['x-user-name'] })
);

app.get('/admin', isAdmin, (req, res) =>
  res.render('admin', { user: req.headers['x-user-name'] })
);

/* =========================
   Register
========================= */
app.post('/register', async (req, res) => {
  const { user, password } = req.body;

  try {
    const exists = await client.query(
      'SELECT 1 FROM users WHERE username = $1',
      [user]
    );

    if (exists.rows.length > 0) {
      return res.status(400).send('El usuario ya existe');
    }

    const hashed = await bcrypt.hash(password, 10);

    await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [user, hashed, 'user']
    );

    res.send('Usuario registrado correctamente');
  } catch (err) {
    console.error('❌ Error register:', err);
    res.status(500).send('Error registrando usuario');
  }
});

/* =========================
   LOGIN (CORREGIDO)
========================= */
app.post('/login', async (req, res) => {
  const { user, password } = req.body;

  try {
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [user]
    );

    if (result.rows.length === 0) {
      return res.status(401).send('Usuario no existe');
    }

    const dbUser = result.rows[0];

    const valid = await bcrypt.compare(password, dbUser.password);

    if (!valid) {
      return res.status(401).send('Password incorrecto');
    }

    /* ===== TOKEN (aquí estaba tu error) ===== */
    const token = jwt.sign(
      {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    /* Guardar cookie */
    res.cookie('token', token, {
      httpOnly: true,
    });

    /* También enviamos headers para tus middlewares */
    res.setHeader('x-user-id', dbUser.id);
    res.setHeader('x-user-name', dbUser.username);
    res.setHeader('x-user-role', dbUser.role);

    res.json({
      message: 'Login correcto',
      token,
      role: dbUser.role,
    });

  } catch (err) {
    console.error('❌ Error login:', err);
    res.status(500).send('Error login');
  }
});

/* =========================
   Ruta protegida ejemplo
========================= */
app.get('/profile', isUser, (req, res) => {
  res.json({
    id: req.headers['x-user-id'],
    username: req.headers['x-user-name'],
    role: req.headers['x-user-role'],
  });
});

/* =========================
   Start server
========================= */
initDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ User service escuchando en puerto ${port}`);
  });
});