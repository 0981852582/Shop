const express = require('express');
const { Pool } = require('pg'); 
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
    user: 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_QmkOm-kAB2jMARLl5TQ',
    host: 'trongtq-truongquoctrong231194-cc9f.h.aivencloud.com',
    port: 19350,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. Lấy danh sách task (Bao gồm description)
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, description, is_completed,
            TO_CHAR(start_date, 'YYYY-MM-DD HH24:MI:SS') as start, 
            TO_CHAR(due_date, 'YYYY-MM-DD HH24:MI:SS') as "end"
            FROM tasks`);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. Thêm task mới[cite: 2]
app.post('/add', async (req, res) => {
    try {
        const { title, description, start_date, due_date } = req.body;
        await pool.query(
            'INSERT INTO tasks (title, description, start_date, due_date, is_completed) VALUES ($1, $2, $3, $4, $5)',
            [title, description, start_date, due_date, false]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// 3. Cập nhật task[cite: 2]
app.post('/update-task', async (req, res) => {
    try {
        const { id, title, description, start_date, due_date, is_completed } = req.body;
        await pool.query(
            'UPDATE tasks SET title = $1, description = $2, start_date = $3, due_date = $4, is_completed = $5 WHERE id = $6',
            [title, description, start_date, due_date, is_completed, id]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// 4. Xóa task
app.delete('/delete-task/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// 5. Toggle hoàn thành nhanh[cite: 2]
app.post('/toggle-complete', async (req, res) => {
    try {
        const { id, is_completed } = req.body;
        await pool.query('UPDATE tasks SET is_completed = $1 WHERE id = $2', [is_completed, id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));