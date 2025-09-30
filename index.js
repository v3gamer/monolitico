const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('database.sqlite');
const bcrypt = require('bcrypt');
const port = 3000;

// Configuración de EJS
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.urlencoded());
app.use(cookieParser());

// Middleware de autenticación
const isAuth = (req, res, next) => {
  if (req.cookies && req.cookies.user) {
    return next();
  }
  res.redirect('/login');
};

// Middleware: solo admin
const isAdmin = (req, res, next) => {
  if (req.cookies && req.cookies.role === "admin") {
    return next();
  }
  res.status(403).send("Acceso denegado: solo admins");
};

// Middleware: solo user
const isUser = (req, res, next) => {
  if (req.cookies && req.cookies.role === "user") {
    return next();
  }
  res.status(403).send("Acceso denegado: solo usuarios");
};

// Página principal con super plantilla
app.get('/', (req, res) => {
  res.render('index', { title: "Super Plantilla", name: "Victor" });
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // buscamos el usuario en la base de datos
  const bd = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = bd.get(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    // guardamos cookies
    res.cookie("user", user.username);
    res.cookie("role", user.role);
    if (user.role === "admin") {
      res.redirect('/admin');
    } else {
      res.redirect('/profile');
    }
  } else {
    res.status(401).redirect('/login');
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie("user");
  res.clearCookie("role");
  res.redirect('/login');
});

// Rutas protegidas
app.get('/admin', isAuth, isAdmin, (req, res) => {
  res.send("Bienvenido administrador");
});

app.get('/profile', isAuth, isUser, (req, res) => {
  res.send("Bienvenido usuario");
});

// Servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

