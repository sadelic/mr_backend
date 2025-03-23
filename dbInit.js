const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or open database file
const dbPath = path.join('C:/Users/ETF BL/8.semestar/MR/sqlite-data', 'database.db');
const db = new sqlite3.Database(dbPath);
module.exports = db;

/*db.serialize(() => {
  db.run(`DROP TABLE assets`);
});*/

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      barcode INTEGER UNIQUE NOT NULL,
      price REAL NOT NULL,
      creation_date TEXT NOT NULL,
      employee_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      image_path TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS asset_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,               
    current_owner_id INTEGER,                
    new_owner_id INTEGER,                    
    current_location_id INTEGER,             
    new_location_id INTEGER,                 
    transfer_timestamp TEXT NOT NULL,                         
    FOREIGN KEY (asset_id) REFERENCES assets(id),               
    FOREIGN KEY (current_owner_id) REFERENCES employees(id),   
    FOREIGN KEY (new_owner_id) REFERENCES employees(id),        
    FOREIGN KEY (current_location_id) REFERENCES locations(id), 
    FOREIGN KEY (new_location_id) REFERENCES locations(id)           
  )`);
//db.run('DROP TABLE IF EXISTS asset_inventory');
//db.close();
console.log("Database and tables created.");
});

/*db.run(`CREATE TABLE IF NOT EXISTS asset_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,               
    current_owner_id INTEGER,                
    new_owner_id INTEGER,                    
    current_location_id INTEGER,             
    new_location_id INTEGER,                 
    transfer_timestamp TEXT NOT NULL,        
    transferred_by INTEGER,                  
    FOREIGN KEY (asset_id) REFERENCES assets(id),               
    FOREIGN KEY (current_owner_id) REFERENCES employees(id),   
    FOREIGN KEY (new_owner_id) REFERENCES employees(id),        
    FOREIGN KEY (current_location_id) REFERENCES locations(id), 
    FOREIGN KEY (new_location_id) REFERENCES locations(id),     
    FOREIGN KEY (transferred_by) REFERENCES employees(id)        
)`); */