import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireClerkAuth } from "../middlewares/clerkAuth";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(
      file.mimetype,
    );
    if (ok) return cb(null, true);
    return cb(new Error("Only jpg/png/webp allowed"));
  },
});

router.post("/image", requireClerkAuth, upload.single("image"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  // Return a URL path you can store in Post.imageUrl
  return res.status(201).json({ imageUrl: `/uploads/${file.filename}` });
});

export default router;
