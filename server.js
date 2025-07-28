
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(cors());
app.use(express.json());

// إنشاء جدول المستخدمين
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        role TEXT,
        fullName TEXT,
        createdAt TEXT
    )
`);

app.get('/', (req, res) => {
    res.send('Server is running...');
});

// بدء السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
