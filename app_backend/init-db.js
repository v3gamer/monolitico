// init-db.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  try {
    await pool.connect();

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
    );    
`);

    await pool.query(
      `INSERT INTO users (username, password, role) VALUES 
    ($1, $2, $3)
    ON CONFLICT (username) DO NOTHING`,
      ['admin', await bcrypt.hash('adminpass', 10), 'admin'],
    );

    await pool.query(
      `INSERT INTO users (username, password, role) VALUES
    ($1, $2, $3)
    ON CONFLICT (username) DO NOTHING`,
      ['user', await bcrypt.hash('userpass', 10), 'user'],
    );
    pool.end();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
  }
}

main();
