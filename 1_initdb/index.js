const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { Picsum } = require('picsum-photos');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('pg');
const app = express();
const port = 3000;
// Configurar vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Conexión a Postgres (TOMA LAS VARIABLES DEL DOCKER COMPOSE)
const client = new Client({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'monolito',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function initDb() {
  await client.connect(); //  conectar antes de usar client

  try {
    // ✅ crear tabla users
    await client.query(`      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL
      )
    `);

    // ✅ crear tabla posts
    await client.query(`  
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        data_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ crear tabla comments
    await client.query(`  
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        post_id INTEGER REFERENCES posts(id),
        data_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ crear tabla likes
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        post_id INTEGER REFERENCES posts(id)
      )
    `);
  } catch (error) {
    console.log('Error initializing database', error);
  }

  // ✅ crear post por usuario "pepe" si no existe
  const createPost = async (id, image_url, content, username) => {
    // ⚠️ añadida la consulta que faltaba
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username],
    );

    // ⚠️ si el usuario no existe, lo creamos automáticamente
    if (userResult.rows.length === 0) {
      const hashed = await bcrypt.hash('1234', 10); // contraseña por defecto
      await client.query(
        `INSERT INTO users (username, password, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [username, hashed, 'user'],
      );
      console.log(`Usuario ${username} creado`);
    }

    const user = await client.query('SELECT id FROM users WHERE username = $1', [
      username,
    ]);
    const userId = user.rows[0].id;

    // ⚠️ corregido: la tabla es "posts" (no "post")
    await client.query(
      `INSERT INTO posts (image_url, content, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [image_url, content, userId],
    );
    console.log(`Post by ${username} created or already exists`);
  };

  // crear posts (usando Picsum correctamente)
  await createPost(1, Picsum.url(), 'Contenido del post 1', 'pepe');
  await createPost(2, Picsum.url(), 'Contenido del post 2', 'pepe');
  await createPost(3, Picsum.url(), 'Contenido del post 3', 'pepe');

  console.log('Base de datos inicializada ✅');
}


initDb();

// Servidor
app.listen(port, () => {
  console.log(`✅ Servidor escuchando en puerto ${port}`);
  console.log('Usuarios de prueba: admin/adminpass y user/userpass');
});
