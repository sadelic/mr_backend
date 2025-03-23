const express = require('express');
const db = require('../dbInit');
const router = express.Router();

//const DB_FILE = 'fixed_assets.db';

// Connect to the SQLite database
//const db = new sqlite3.Database(DB_FILE);

// CREATE - Add a new location
router.post('/', (req, res) => {
  console.log("Received post request for ID:", req.params.id, "Data:", req.body);
    const { city } = req.body;

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    const sql = 'INSERT INTO locations (city) VALUES (?)';
    db.run(sql, [city], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, city });
    });
});

// READ - Get all locations
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM locations';

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// READ - Get a single location by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM locations WHERE id = ?';

    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json(row);
    });
});

// UPDATE - Update a location by ID
router.put('/:id', (req, res) => {
  console.log("Received update request for ID:", req.params.id, "Data:", req.body);
    const { id } = req.params;
    const { city } = req.body;

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    const sql = 'UPDATE locations SET city = ? WHERE id = ?';
    db.run(sql, [city, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json({ id, city });
    });
});

// DELETE - Delete a location by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM locations WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json({ message: 'Location deleted' });
    });
});

module.exports = router;