import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());

// ✅ Enable CORS for frontend on port 3000
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

// ✅ Ensure upload folder exists
const uploadPath = path.resolve("backend/uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Upload a new file
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  res.json({
    message: "File uploaded successfully",
    fileUrl: `http://localhost:5000/uploads/${file.filename}`,
  });
});

// ✅ Update (replace) a file
app.put("/update/:oldFilename", upload.single("file"), (req, res) => {
  const decodedName = decodeURIComponent(req.params.oldFilename);
  const oldFilePath = path.join(uploadPath, decodedName);

  // Delete old file if exists
  if (fs.existsSync(oldFilePath)) {
    fs.unlinkSync(oldFilePath);
  }

  const file = req.file;
  res.json({
    message: "File replaced successfully",
    fileUrl: `http://localhost:5000/uploads/${file.filename}`,
  });
});

// ✅ Serve static uploaded files
app.use("/uploads", express.static(uploadPath));

// ✅ List all uploaded files
app.get("/files", (req, res) => {
  const files = fs.readdirSync(uploadPath).map((name) => ({
    name,
    url: `http://localhost:5000/uploads/${name}`,
  }));
  res.json(files);
});

// ✅ Delete file
app.delete("/delete/:filename", (req, res) => {
  const decodedName = decodeURIComponent(req.params.filename);
  const filePath = path.join(uploadPath, decodedName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted successfully" });
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// ✅ Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
