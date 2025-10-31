const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
  host: process.env.DB_HOST || 'contenedor_postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

function isAdmin(req, res, next) {
  if (req.cookies.user && req.cookies.role === 'admin') return next();
  return res.redirect('/');
}

function isUser(req, res, next) {
  if (req.cookies.user && req.cookies.role === 'user') return next();
  return res.redirect('/');
}

app.get('/', (req, res) => res.render('login'));
app.get('/home', isUser, (req, res) =>
  res.render('home', { user: req.cookies.user }),
);
app.get('/admin', isAdmin, (req, res) =>
  res.render('admin', { user: req.cookies.user }),
);

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.clearCookie('role');
  console.log('logged out');
  res.redirect('/');
});

app.post('/login', async (req, res) => {
  const { user, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT username, password, role FROM users WHERE username = $1',
      [user],
    );

    const dbuser = result.rows[0];
    if (!dbuser) {
      console.log('Usuario no encontrado');
      return res.redirect('/');
    }

    const ok = await bcrypt.compare(password, dbuser.password);
    if (!ok) {
      console.log('ContraseÃ±a incorrecta');
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

app.post('/registro', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, 'user'],
    );
    console.log('Usuario registrado');
    return res.redirect('/');
  } catch (err) {
    console.error('Registro error:', err);
    return res.redirect('/');
  }
});

app.listen(port, () => {
  console.log('Usuarios de prueba: admin/adminpass y user/userpass');
});
