const express = require("express");
const cors = require("cors");
const app = express();

// Import route files
const assetsRoutes = require("./routes/assets");
const employeesRoutes = require("./routes/employees");
const locationsRoutes = require("./routes/locations");

// Middleware
app.use(cors());
app.use(express.json());

// Use modular routes
app.use("/api/assets", assetsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/locations", locationsRoutes);


//app.use("/uploads", express.static("uploads"));

// Start server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});