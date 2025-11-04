const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Configurar vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Conexión a Postgres (TOMA LAS VARIABLES DEL DOCKER COMPOSE)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

console.log(`🔌 Conectando a PostgreSQL en: ${process.env.DB_HOST}`);

// Middlewares de autenticación
function isAdmin(req, res, next) {
  if (req.cookies.user && req.cookies.role === 'admin') return next();
  return res.redirect('/');
}

function isUser(req, res, next) {
  if (req.cookies.user && req.cookies.role === 'user') return next();
  return res.redirect('/');
}

// Rutas
app.get('/', (req, res) => res.render('login'));
app.get('/home', isUser, (req, res) => res.render('home', { user: req.cookies.user }));
app.get('/admin', isAdmin, (req, res) => res.render('admin', { user: req.cookies.user }));

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.clearCookie('role');
  console.log('logged out');
  res.redirect('/');
});

app.get('/register', (req, res) => res.render('register'));

// LOGIN
app.post('/login', async (req, res) => {
  const { user, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT username, password, role FROM users WHERE username = $1',
      [user]
    );

    const dbuser = result.rows[0];
    if (!dbuser) {
      console.log('Usuario no encontrado');
      return res.redirect('/');
    }

    const ok = await bcrypt.compare(password, dbuser.password);
    if (!ok) {
      console.log('Contraseña incorrecta');
      return res.redirect('/');
    }

    res.cookie('user', dbuser.username, { httpOnly: true });
    res.cookie('role', dbuser.role, { httpOnly: true });

    console.log(`${dbuser.role} logged in`);
    return res.redirect(dbuser.role === 'admin' ? '/admin' : '/home');
  } catch (err) {
    console.error('Login error:', err);
    return res.redirect('/');
  }
});

// REGISTER
app.post('/register', async (req, res) => {
  const { user, password } = req.body;

  try {
    const exists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [user]
    );
    if (exists.rows.length > 0) {
      console.log('El usuario ya existe');
      return res.send('El usuario ya existe. <a href="/register">Volver</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [user, hashedPassword, 'user']
    );

    console.log('Usuario registrado:', user);
    res.send(`Usuario ${user} registrado correctamente. <a href="/">Iniciar sesión</a>`);
  } catch (err) {
    console.error('Error registrando usuario:', err);
    res.send('Error al registrar usuario. <a href="/register">Volver</a>');
  }
});

// Servidor
app.listen(port, () => {
  console.log(`✅ Servidor escuchando en puerto ${port}`);
});
