import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import sharp from 'sharp';
import { authenticate } from '../middlewares/auth.middleware';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

/**
 * Auto-convert uploaded images:
 * - PNG/GIF → WebP (removes alpha transparency issues, smaller filesize)
 * - JPEG → keep as-is (already no alpha, good compression)
 * - WebP → keep as-is
 * Returns the final filename after conversion.
 */
async function autoConvertImage(file: Express.Multer.File): Promise<{ filename: string; size: number; mimetype: string }> {
  const convertible = ['image/png', 'image/gif'];

  if (!convertible.includes(file.mimetype)) {
    // JPEG & WebP: no conversion needed
    return { filename: file.filename, size: file.size, mimetype: file.mimetype };
  }

  // Convert PNG/GIF → flatten alpha to white → WebP
  const baseName = path.parse(file.filename).name;
  const newFilename = `${baseName}.webp`;
  const newPath = path.join(UPLOAD_DIR, newFilename);

  await sharp(file.path)
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Remove alpha, white bg
    .webp({ quality: 85 })
    .toFile(newPath);

  // Remove original file
  fs.unlinkSync(file.path);

  const stats = fs.statSync(newPath);
  return { filename: newFilename, size: stats.size, mimetype: 'image/webp' };
}

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const converted = await autoConvertImage(req.file);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${converted.filename}`;

    res.json({
      url: fileUrl,
      filename: converted.filename,
      originalName: req.file.originalname,
      size: converted.size,
      mimetype: converted.mimetype,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses gambar', detail: err.message });
  }
});

// Public upload — validates JWT token from query string instead of auth header
router.post('/public', upload.single('file'), async (req: Request, res: Response) => {
  const jwt = require('jsonwebtoken');
  const token = req.query.token as string;

  if (!token) {
    res.status(401).json({ error: 'Token diperlukan' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== 'senior_public_update') {
      res.status(401).json({ error: 'Token tidak valid' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const converted = await autoConvertImage(req.file);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${converted.filename}`;

    res.json({
      url: fileUrl,
      filename: converted.filename,
      originalName: req.file.originalname,
      size: converted.size,
      mimetype: converted.mimetype,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses gambar', detail: err.message });
  }
});

// Public upload for bukti transfer — no authentication required
const buktiTransferStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(UPLOAD_DIR, 'bukti-transfer');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

const buktiTransferUpload = multer({
  storage: buktiTransferStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file JPEG, PNG, WebP, atau PDF yang diperbolehkan'));
    }
  },
});

router.post('/bukti-transfer', buktiTransferUpload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/bukti-transfer/${req.file.filename}`;

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;
