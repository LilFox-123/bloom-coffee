import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/public/uploads/menu
export const MENU_UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads/menu');
fs.mkdirSync(MENU_UPLOAD_DIR, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MENU_UPLOAD_DIR),
  filename: (req, file, cb) => {
    // [timestamp]-[sanitized-original-name]
    const safe = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.\-_]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
}

export const uploadMenuImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('image');

// Wrap multer so its errors return clean JSON instead of crashing the request.
export function menuImageUpload(req, res, next) {
  uploadMenuImage(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh vượt quá 5MB' : err.message || 'Tải ảnh thất bại';
      return res.status(400).json({ success: false, message });
    }
    next();
  });
}
