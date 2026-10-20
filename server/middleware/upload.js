import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/errors.js';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const uploadDirectory = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

try {
  fs.mkdirSync(uploadDirectory, { recursive: true });
} catch (err) {
  console.warn('Could not create upload directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDirectory),
  filename: (req, file, callback) => {
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensions[file.mimetype] || ''}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(new AppError('Upload a JPG, PNG, or WebP image.', 400));
    callback(null, true);
  }
});
