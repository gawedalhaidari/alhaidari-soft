
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "db", "movements.db");

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(__dirname)); // serve frontend

// إنشاء قاعدة البيانات إذا لم تكن موجودة
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("خطأ بفتح قاعدة البيانات:", err.message);
    console.log("✅ تم فتح قاعدة البيانات بنجاح.");

    db.run(`
        CREATE TABLE IF NOT EXISTS movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeName TEXT,
            date TEXT,
            note TEXT,
            requiredAmount REAL,
            totalAmount REAL,
            suspendedTotal REAL,
            status TEXT,
            movements TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS attachments (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            data TEXT
        )
    `);
    db.run(\`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            password TEXT,
            role TEXT,
            fullName TEXT,
            createdAt TEXT
        )
    \`);
});

// عرض جميع الحركات
app.get("/api/movements", (req, res) => {
    db.all("SELECT * FROM movements", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(row => row.movements = JSON.parse(row.movements));
        res.json(rows);
    });
});

// إضافة حركة جديدة
app.post("/api/movements", (req, res) => {
    const { employeeName, date, note, requiredAmount, totalAmount, suspendedTotal, status, movements } = req.body;
    const sql = \`
        INSERT INTO movements (employeeName, date, note, requiredAmount, totalAmount, suspendedTotal, status, movements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`;
    db.run(sql, [employeeName, date, note, requiredAmount, totalAmount, suspendedTotal, status, JSON.stringify(movements)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// حذف حركة
app.delete("/api/movements/:id", (req, res) => {
    db.run("DELETE FROM movements WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// إضافة مرفق
app.post("/api/attachments", (req, res) => {
    const { id, name, type, data } = req.body;
    db.run("INSERT INTO attachments (id, name, type, data) VALUES (?, ?, ?, ?)", [id, name, type, data], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// عرض مرفق
app.get("/api/attachments/:id", (req, res) => {
    db.get("SELECT * FROM attachments WHERE id = ?", [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).send("غير موجود");
        res.setHeader("Content-Type", row.type);
        const buffer = Buffer.from(row.data, "base64");
        res.send(buffer);
    });
});

// نسخ احتياطي
app.get("/api/backup", (req, res) => {
    db.all("SELECT * FROM movements", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// استعادة نسخة احتياطية
app.post("/api/restore", (req, res) => {
    db.run("DELETE FROM movements", [], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const movements = req.body;
        const stmt = db.prepare(\`
            INSERT INTO movements (id, employeeName, date, note, requiredAmount, totalAmount, suspendedTotal, status, movements)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`);

        for (const m of movements) {
            stmt.run([
                m.id, m.employeeName, m.date, m.note,
                m.requiredAmount, m.totalAmount,
                m.suspendedTotal, m.status,
                JSON.stringify(m.movements)
            ]);
        }

        stmt.finalize();
        res.json({ restored: movements.length });
    });
});

app.listen(port, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${port}`);
});
