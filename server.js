import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Environment Variables
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const PORT = process.env.PORT || 5000;

// ✅ Enable CORS for frontend
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

// ✅ Ensure upload folder exists
const uploadPath = path.resolve(process.env.UPLOAD_DIR || "uploads");
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
    fileUrl: `${BACKEND_URL}/uploads/${file.filename}`,
  });
});

// ✅ Update (replace) a file
app.put("/update/:oldFilename", upload.single("file"), (req, res) => {
  const decodedName = decodeURIComponent(req.params.oldFilename);
  const oldFilePath = path.join(uploadPath, decodedName);

  if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

  const file = req.file;
  res.json({
    message: "File replaced successfully",
    fileUrl: `${BACKEND_URL}/uploads/${file.filename}`,
  });
});

// ✅ Serve static uploaded files
app.use("/uploads", express.static(uploadPath));

// ✅ List all uploaded files
app.get("/files", (req, res) => {
  const files = fs.readdirSync(uploadPath).map((name) => ({
    name,
    url: `${BACKEND_URL}/uploads/${name}`,
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
app.listen(PORT, () => console.log(`✅ Server running on ${BACKEND_URL}`));
