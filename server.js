const express = require('express');
const { Pool } = require('pg'); // Thư viện đã cài bằng lệnh npm install pg
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình kết nối lấy từ Aiven PostgreSQL của bạn
const pool = new Pool({
    user: 'avnadmin',
	password: process.env.DB_PASSWORD || 'AVNS_QmkOm-kAB2jMARLl5TQ'
    host: 'trongtq-truongquoctrong231194-cc9f.h.aivencloud.com',
    port: 19350,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Lấy danh sách task
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, is_completed,
            TO_CHAR(start_date, 'YYYY-MM-DD HH24:MI:SS') as start, 
            TO_CHAR(due_date, 'YYYY-MM-DD HH24:MI:SS') as "end"
            FROM tasks`);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// Thêm task mới
app.post('/add', async (req, res) => {
    try {
        const { title, start_date, due_date } = req.body;
        await pool.query(
            'INSERT INTO tasks (title, start_date, due_date, is_completed) VALUES ($1, $2, $3, $4)',
            [title, start_date, due_date, false]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// Cập nhật trạng thái hoàn thành
app.post('/toggle-complete', async (req, res) => {
    try {
        const { id, is_completed } = req.body;
        await pool.query('UPDATE tasks SET is_completed = $1 WHERE id = $2', [is_completed, id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(3000, () => console.log("Server đang chạy tại http://localhost:3000"));  