import multer from 'multer';
import { cloudinaryStorage } from '../config/cloudinary.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
}

export const uploadMenuImage = multer({
  storage: cloudinaryStorage,
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
