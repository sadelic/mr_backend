const express = require('express');
const db = require('../dbInit');
const router = express.Router();

//const DB_FILE = 'fixed_assets.db';

// Connect to the SQLite database
//const db = new sqlite3.Database(DB_FILE);

// CREATE - Add a new employee
router.post('/', (req, res) => {
    const { name, email } = req.body;
    console.log("Post request ",req.body);

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const sql = 'INSERT INTO employees (name, email) VALUES (?, ?)';
    db.run(sql, [name, email], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, email });
    });
});

// READ - Get all employees
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM employees';

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// READ - Get a single employee by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM employees WHERE id = ?';

    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json(row);
    });
});

// UPDATE - Update an employee by ID
router.put('/:id', (req, res) => {
    console.log("Put request ",req.body);
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const sql = 'UPDATE employees SET name = ?, email = ? WHERE id = ?';
    db.run(sql, [name, email, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json({ id, name, email });
    });
});

// DELETE - Delete an employee by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM employees WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee deleted' });
    });
});

module.exports = router;