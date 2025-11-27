// Simple static server for admin/dist on port 9809
const express = require("express");
const path = require("path");
const app = express();
const PORT = 9809;

const distPath = path.join(__dirname, "admin", "dist");
app.use(express.static(distPath));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(
    `Admin frontend (dist) is being served on http://localhost:${PORT}`
  );
});
