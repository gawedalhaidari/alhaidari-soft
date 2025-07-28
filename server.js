const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// إنشاء قاعدة البيانات
const db = new sqlite3.Database('./db/movements.db', (err) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
  } else {
    console.log('✅ تم الاتصال بقاعدة البيانات SQLite');
  }
});

// إنشاء الجدول إذا لم يكن موجودًا
db.run(`
  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeName TEXT,
    date TEXT,
    transactionNumber TEXT,
    amountYemeni REAL,
    amountRequested REAL,
    difference REAL,
    differenceStatus TEXT,
    previousPendingAmount REAL,
    type TEXT,
    notes TEXT
  );
`);

// تشغيل الخادم
app.listen(port, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${port}`);
});
