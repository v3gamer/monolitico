const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { Picsum } = require('picsum-photos');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

const JWT_SECRET = 'secretkey';

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
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(403);
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

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
app.get('/', (_, res) => res.render('login'));
app.get('/home', isUser, (req, res) =>
  res.render('home', { user: req.cookies.user }),
);
app.get('/admin', isAdmin, (req, res) =>
  res.render('admin', { user: req.cookies.user }),
);
app.get('/register', (_, res) => res.render('register'));

app.get('/logout', (_, res) => {
  res.clearCookie('user');
  res.clearCookie('role');
  console.log('logged out');
  res.redirect('/');
});

//post /posts <-- crear un post
app.post('/post', verifyToken, async (req, res) => {
  //creamos el post,leyendo del req.body los datos necesarios
  //el creador del post sera el del token
  const { content } = req.body;
  const imageURL = Picsum.url();
  const user = req.user;

  //insertamos el post en la base de datos
  await client
    .query(
      `INSERT INTO posts (image_url, content, user_id)
     VALUES ($1, $2, $3) RETURNING id`,
      [imageURL, content, user.id],
    )
    .then((result) => {
      res.json({ id: result.rows[0].id });
    })
    .catch((err) => {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//delete /posts <-- eliminar un post
app.delete('/post/:id', verifyToken, async (req, res) => {
  //eliminamos el post,leyendo del req.body el id del post
  //el creador del post sera el del token
  //el id del req.params
  const { id } = req.params;
  const  user  = req.user;

  //si el post existe o no eres el creador
  await client
    .query('SELECT * FROM posts WHERE id = $1 AND user_id = $2', [id, user.id])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ error: 'No tienes permiso para eliminar este post' });
      }
      client.query(
        'DELETE FROM comments WHERE post_id = $1', 
        [id]
      )
          .then(() => {
        console.log('Comments associated with post deleted');
      })
      client
        .query('DELETE FROM likes WHERE post_id = $1', [id])
        .then(() => {
          console.log('Likes associated with post deleted');
        });
      //eliminamos el post
      client
        .query('DELETE FROM posts WHERE id = $1', [id])
        .then(() => {
          res.json({ message: 'Post eliminado con éxito' });
        })
        .catch((err) => {
          console.error('Error deleting post:', err);
          res.status(500).json({ error: 'Internal server error' });
        });
    })
    .catch((err) => {
      console.error('Error checking post:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//get <-- un elemento comments (quizás)
app.get('/comments/:postId', async (req, res) => {
  //obtenemos los comentarios,leyendo del req.params el id del post
  const { postId } = req.params;
  console.log('Post ID for comments:', postId);
  //obtenemos los comentarios con un join de la tabla comments y posts
  await client
    .query(
      `SELECT comments.id, comments.content,users.username
     FROM comments
     JOIN users ON comments.user_id = users.id
     WHERE comments.post_id = $1 ORDER BY comments.data_created DESC`,
      [postId],
    )
    .then((result) => {
      res.json(result.rows);
      console.log('Comments retrieved:', result.rows);
    })
    .catch((err) => {
      console.error('Error getting comments:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});
//post crear comment
app.post('/comment', verifyToken, async (req, res) => {
  //creamos el comentario,leyendo del req.body los datos necesarios
  //el creador del comment sera el del token
  const { content, postId } = req.body;
  console.log('Creating comment for post ID:', postId, 'with content:', content);
  const  user = req.user;
  console.log('User creating comment:', user);

  //insertamos el comment en la base de datos
  await client
    .query(
      'INSERT INTO comments (content, user_id, post_id) VALUES ($1, $2, $3) RETURNING id',
      [content, user.id, postId],
    )
    .then((result) => {
      res.json(result.rows[0]);
    })
    .catch((err) => {
      console.error('Error creating comment:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//delete comment
app.delete('/comment/:id', verifyToken, async (req, res) => {
  //eliminamos el comment,leyendo del req.body el id del comment
  //el creador del comment sera el del token
  //el id del req.params
  const { id } = req.params;
  const { user } = req.user;

  //si el comment existe o no eres el creador
  await client
    .query('SELECT * FROM comments WHERE id = $1 AND user_id = $2', [
      id,
      user.id,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ error: 'No tienes permiso para eliminar este comment' });
      }
      //eliminamos el comment
      client
        .query('DELETE FROM comments WHERE id = $1', [id])
        .then(() => {
          res.json({ message: 'Comment eliminado con éxito' });
        })
        .catch((err) => {
          console.error('Error deleting comment:', err);
          res.status(500).json({ error: 'Internal server error' });
        });
    })
    .catch((err) => {
      console.error('Error checking comment:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});


app.post('/togglelike', verifyToken, async (req, res) => {
  const { postId } = req.body; // post ID
  const user = req.user;
  
  // Check if the like already exists
  try {
    const likeCheck = await client.query(
      'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
      [user.id, postId]
    );
    
    if (likeCheck.rows.length > 0) {
      // Like exists, so remove it
      await client.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [user.id, postId]
      );
      res.json({ liked: false });
    } else {
      // Like doesn't exist, so add it
      await client.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [user.id, postId]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/checklike/:postId', verifyToken, async (req, res) => {
  const { postId } = req.params;
  const user = req.user;

  try {
    const likeCheck = await client.query(
      'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
      [user.id, postId]
    );

    if (likeCheck.rows.length > 0) {
      res.json({ liked: true });
    } else {
      res.json({ liked: false });
    }
  } catch (err) {
    console.error('Error checking like status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//contar likes de un post
app.get('/likes/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const likeCount = await client.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1',
      [postId]
    );
    res.json({ count: parseInt(likeCount.rows[0].count, 10) });
  } catch (err) {
    console.error('Error counting likes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//delete like
app.delete('/like/:id', verifyToken, async (req, res) => {
  //eliminamos el like,leyendo del req.body el id del like
  //el creador del like sera el del token
  //el id del req.params
  const { id } = req.params;
  const { user } = req.user;

  //si el like existe o no eres el creador
  await client
    .query('SELECT * FROM likes WHERE id = $1 AND user_id = $2', [id, user.id])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ error: 'No tienes permiso para eliminar este like' });
      }
      //eliminamos el like
      client
        .query('DELETE FROM likes WHERE id = $1', [id])
        .then(() => {
          res.json({ message: 'Like eliminado con éxito' });
        })
        .catch((err) => {
          console.error('Error deleting like:', err);
          res.status(500).json({ error: 'Internal server error' });
        });
    })
    .catch((err) => {
      console.error('Error checking like:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  client
    .query('SELECT * FROM users WHERE username = $1', [username])
    .then(async (result) => {
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'ContraseÃ±a incorrecta' });
      }
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.json({ token });
    })
    .catch((err) => {
      console.error('Error during login:', err);
      res.status(500).json({ message: 'Error en el servidor' });
    });
});

// REGISTER
app.post('/register', async (req, res) => {
  const { user, password } = req.body;

  try {
    const exists = await client.query('SELECT * FROM users WHERE username = $1', [
      user,
    ]);
    if (exists.rows.length > 0) {
      console.log('El usuario ya existe');
      return res.send('El usuario ya existe. <a href="/register">Volver</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [user, hashedPassword, 'user'],
    );

    console.log('Usuario registrado:', user);
    res.send(
      `Usuario ${user} registrado correctamente. <a href="/">Iniciar sesión</a>`,
    );
  } catch (err) {
    console.error('Error registrando usuario:', err);
    res.send('Error al registrar usuario. <a href="/register">Volver</a>');
  }
});

app.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected profile route', user: req.user });
});

// ⚠️ corregido JOIN (users.id)
app.get('/posts', async (_, res) => {
  const resultado = await client.query(
    'SELECT posts.id, posts.image_url, posts.content, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.data_created DESC' ,
  );
  const posts = resultado.rows;
  res.json(posts);
});

initDb();

// Servidor
app.listen(port, () => {
  console.log(`✅ Servidor escuchando en puerto ${port}`);
  console.log('Usuarios de prueba: admin/adminpass y user/userpass');
});
