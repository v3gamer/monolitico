const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('database.sqlite', { verbose: console.log });

//tabla users

const sentencia = db.prepare('CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT unique,password TEXT,role TEXT)');

sentencia.run();

//insertar usuarios

const insertar = db.prepare('INSERT or IGNORE INTO users (username,password,role) VALUES (?,?,?)')

const hashedPasswordAdmin = bcrypt.hashSync("12345", 10);
insertar.run("admin",hashedPasswordAdmin,"admin");

const hashedPasswordUser = bcrypt.hashSync("1234", 10);
insertar.run("user",hashedPasswordUser,"user")
