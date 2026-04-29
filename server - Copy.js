const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dbConfig = {
    user: 'sa',
    password: '123456', 
    server: 'localhost', 
    database: 'todo_app',
    options: {
        instanceName: 'SQLEXPRESS', 
        encrypt: true,
        trustServerCertificate: true
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/tasks', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT id, title, is_completed,
            CONVERT(VARCHAR, start_date, 120) as start, 
            CONVERT(VARCHAR, due_date, 120) as [end]
            FROM tasks`);
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/add', async (req, res) => {
    try {
        const { title, start_date, due_date } = req.body;
        const now = new Date();
        if (new Date(start_date) < now.setHours(0,0,0,0)) {
            return res.status(400).send("Không được tạo công việc cho ngày quá khứ!");
        }
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('title', sql.NVarChar, title)
            .input('start', sql.VarChar, start_date)
            .input('end', sql.VarChar, due_date)
            .query('INSERT INTO tasks (title, start_date, due_date, is_completed) VALUES (@title, CAST(@start AS DATETIME), CAST(@end AS DATETIME), 0)');
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/update-task', async (req, res) => {
    try {
        const { id, title, start_date, due_date, is_completed } = req.body;
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            .input('start', sql.VarChar, start_date)
            .input('end', sql.VarChar, due_date)
            .input('status', sql.Bit, is_completed ? 1 : 0)
            .query(`UPDATE tasks SET title=@title, start_date=CAST(@start AS DATETIME), due_date=CAST(@end AS DATETIME), is_completed=@status WHERE id=@id`);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/toggle-complete', async (req, res) => {
    try {
        const { id, is_completed } = req.body;
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.Bit, is_completed ? 1 : 0)
            .query('UPDATE tasks SET is_completed = @status WHERE id = @id');
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/delete-task', async (req, res) => {
    try {
        const { id } = req.body;
        let pool = await sql.connect(dbConfig);
        await pool.request().input('id', sql.Int, id).query('DELETE FROM tasks WHERE id = @id');
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(3000, () => console.log("Server đang chạy tại http://localhost:3000"));