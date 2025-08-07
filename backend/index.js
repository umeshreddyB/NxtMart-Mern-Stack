import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import cors from 'cors';



const app = express();
app.use(express.json());
app.use(cors());

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB setup
const dbPath = path.resolve(__dirname, 'database.db');
let db = null;

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create users table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT UNIQUE,
        number NUMBER
      )
    `);

    app.listen(3005, 'localhost', () => {
      console.log('Server is running on http://localhost:3005');
    });

    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

initializeDb();

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password , number } = req.body;
  try {
    await db.run('INSERT INTO users (username, password, number) VALUES (?, ?)', [username, password, number]);
    res.status(201).json({ success: true, message: "User created successfully" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ success: false, message: "User already exists or database error" });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

    if (user) {
      const token = jwt.sign({ username: user.username, id: user.id }, "your_secret_key");
      res.status(200).json({ success: true, message: "Login successful", jwt_token: token });
    } else {
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/getuser", async (req, res) => {
  const userna= await db.get('SELECT * FROM users');
  res.status(200).json({ success: true, user: userna})

})
