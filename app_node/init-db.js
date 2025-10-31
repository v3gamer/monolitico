<<<<<<< HEAD
const { Client } = require('pg');
const bcrypt = require('bcrypt');

=======
// init-db.js
const { Client } = require('pg');
const bcrypt = require('bcrypt');
>>>>>>> 2_capas
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  try {
    await client.connect();

    await client.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
    );    
`);

    await client.query(
<<<<<<< HEAD
      ` INSERT INTO users (username, password, role) VALUES 
=======
      `INSERT INTO users (username, password, role) VALUES 
>>>>>>> 2_capas
    ($1, $2, $3)
    ON CONFLICT (username) DO NOTHING`,
      ['admin', await bcrypt.hash('adminpass', 10), 'admin'],
    );

    await client.query(
<<<<<<< HEAD
      ` INSERT INTO users (username, password, role) VALUES
=======
      `INSERT INTO users (username, password, role) VALUES
>>>>>>> 2_capas
    ($1, $2, $3)
    ON CONFLICT (username) DO NOTHING`,
      ['user', await bcrypt.hash('userpass', 10), 'user'],
    );
<<<<<<< HEAD
=======

>>>>>>> 2_capas
    client.end();
  } catch (err) {
    console.error('Error initializing database', err);
  }
}

main();
