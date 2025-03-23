const express = require("express");
const db = require("../dbInit");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set unique file name
  },
});
const upload = multer({ storage: storage });

router.get("/inventory", (req, res) => {
  const sql = `
    SELECT 
      ai.id, 
      assets.name AS asset_name, 
      assets.barcode AS asset_barcode,
      employees.name AS current_owner,
      employees_new.name AS new_owner,
      locations.city AS current_location,
      locations_new.city AS new_location,
      ai.transfer_timestamp
    FROM asset_inventory ai
    JOIN assets ON ai.asset_id = assets.id
    JOIN employees ON ai.current_owner_id = employees.id
    LEFT JOIN employees AS employees_new ON ai.new_owner_id = employees_new.id
    JOIN locations ON ai.current_location_id = locations.id
    LEFT JOIN locations AS locations_new ON ai.new_location_id = locations_new.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log("Rows:", rows); 
    res.status(200).json(rows);
  });
});

router.post("/", upload.single("image"), (req, res) => {
  const { name, description, price, barcode, employee_id, location_id } =
    req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const creation_date = new Date().toISOString();

  if (
    !name ||
    !barcode ||
    !price ||
    !creation_date ||
    !employee_id ||
    !location_id
  ) {
    return res.status(400).json({
      error:
        "All required fields must be provided (name, barcode, price, creation_date, employee_id, location_id)",
    });
  }

  const sql =
    "INSERT INTO assets (name, description, barcode, price, creation_date, employee_id, location_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  db.run(
    sql,
    [
      name,
      description,
      barcode,
      price,
      creation_date,
      employee_id,
      location_id,
      image_path,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        description,
        barcode,
        price,
        image_path,
      });
    }
  );
});

router.post("/transfer", (req, res) => {
  const {
    osBarcode,
    currentPerson,
    personToTransfer,
    currentLocation,
    locationToTransfer,
    
  } = req.body;

  if (!osBarcode || !personToTransfer || !locationToTransfer) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided" });
  }

  // Update the asset details in the assets table (asset transfer logic)
  db.run(
    `
    UPDATE assets
    SET 
      employee_id = (SELECT id FROM employees WHERE name = ?),
      location_id = (SELECT id FROM locations WHERE city = ?)
    WHERE barcode = ?
  `,
    [personToTransfer, locationToTransfer, osBarcode],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Optional: You could log this transfer in a separate table to track asset movement
      db.run(
        `
      INSERT INTO asset_inventory (asset_id, current_owner_id, new_owner_id, current_location_id, new_location_id, transfer_timestamp)
      VALUES (
        (SELECT id FROM assets WHERE barcode = ?),
        (SELECT id FROM employees WHERE name = ?),
        (SELECT id FROM employees WHERE name = ?),
        (SELECT id FROM locations WHERE city = ?),
        (SELECT id FROM locations WHERE city = ?),
        CURRENT_TIMESTAMP
      )
    `,
        [
          osBarcode,
          currentPerson,
          personToTransfer,
          currentLocation,
          locationToTransfer,
          
        ],
        function (err) {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error logging asset transfer" });
          }

          res.status(200).json({ message: "Asset transfer successful." });
        }
      );
    }
  );
});

// READ - Get all assets
router.get("/", (req, res) => {
  const sql = `SELECT 
                    assets.id, 
                    assets.name, 
                    assets.description, 
                    assets.barcode, 
                    assets.price, 
                    assets.creation_date, 
                    employees.name AS employee, 
                    locations.city AS location, 
                    assets.image_path 
                 FROM assets
                 JOIN employees ON assets.employee_id = employees.id
                 JOIN locations ON assets.location_id = locations.id`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// READ - Get a single asset by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT 
                    assets.id, 
                    assets.name, 
                    assets.description, 
                    assets.barcode, 
                    assets.price, 
                    assets.creation_date, 
                    employees.name AS employee, 
                    locations.city AS location, 
                    assets.image_path 
                 FROM assets
                 JOIN employees ON assets.employee_id = employees.id
                 JOIN locations ON assets.location_id = locations.id
                 WHERE assets.id = ?`;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json(row);
  });
});
router.get("/barcode/:barcode", (req, res) => {
  const barcode = req.params.barcode;
  const sql = `
    SELECT 
      assets.id, 
      assets.name, 
      assets.description, 
      assets.barcode, 
      assets.price, 
      assets.creation_date, 
      employees.name AS employee, 
      locations.city AS location, 
      assets.image_path
    FROM assets
    JOIN employees ON assets.employee_id = employees.id
    JOIN locations ON assets.location_id = locations.id
    WHERE assets.barcode = ?
  `;

  db.get(sql, [barcode], (err, asset) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json(asset); // Return asset data for the scanned barcode
  });
});



router.put("/:id", upload.single("image"), (req, res) => {
  console.log("Received data:", req.body);
  console.log("Received file:", req.file);

  const { id } = req.params;
  const {
    name,
    description,
    barcode,
    price,
    creation_date,
    employee_id,
    location_id,
    image_path, // This will be the existing image path if no new image is uploaded
  } = req.body;

  // If no new image is uploaded, set image_path to null
  const newImagePath = req.file ? req.file.path : image_path;

  if (
    !name ||
    !barcode ||
    !price ||
    !creation_date ||
    !employee_id ||
    !location_id
  ) {
    return res.status(400).json({
      error:
        "All required fields must be provided (name, barcode, price, creation_date, employee_id, location_id)",
    });
  }

  const sql = `UPDATE assets 
                 SET name = ?, description = ?, barcode = ?, price = ?, creation_date = ?, employee_id = ?, location_id = ?, image_path = ? 
                 WHERE id = ?`;

  db.run(
    sql,
    [
      name,
      description,
      barcode,
      price,
      creation_date,
      employee_id,
      location_id,
      newImagePath, // Ensure that image_path is set to null if no image is uploaded
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.status(200).json({
        id,
        name,
        description,
        barcode,
        price,
        creation_date,
        employee_id,
        location_id,
        image_path: newImagePath, // Send the updated image path back
      });
    }
  );
});
// DELETE - Delete an asset by ID
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM assets WHERE id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json({ message: "Asset deleted" });
  });
});

module.exports = router;
// UPDATE - Update an asset by ID
/*router.put("/:id", (req, res) => {
  console.log(
    "Received update request for ID:",
    req.params.id,
    "Data:",
    req.body
  );
  const { id } = req.params;
  const {
    name,
    description,
    barcode,
    price,
    creation_date,
    employee_id,
    location_id,
    image_path, // This can be null
  } = req.body;

  // If no image is uploaded, set image_path to null
  const newImagePath = image_path === "null" || !image_path ? null : image_path;

  if (
    !name ||
    !barcode ||
    !price ||
    !creation_date ||
    !employee_id ||
    !location_id
  ) {
    return res.status(400).json({
      error:
        "All required fields must be provided (name, barcode, price, creation_date, employee_id, location_id)",
    });
  }

  const sql = `UPDATE assets 
                 SET name = ?, description = ?, barcode = ?, price = ?, creation_date = ?, employee_id = ?, location_id = ?, image_path = ? 
                 WHERE id = ?`;
  db.run(
    sql,
    [
      name,
      description,
      barcode,
      price,
      creation_date,
      employee_id,
      location_id,
      newImagePath, // Ensure that image_path is set to null if no image is uploaded
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.status(200).json({
        id,
        name,
        description,
        barcode,
        price,
        creation_date,
        employee_id,
        location_id,
        image_path: newImagePath, // Send the updated image path back
      });
    }
  );
});*/
