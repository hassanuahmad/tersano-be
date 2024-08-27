import sqlite3 from "sqlite3";

sqlite3.verbose();

const db = new sqlite3.Database("db.sqlite");

// create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
  )`);

// Create products table
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT NOT NULL
  )`);

export default db;
