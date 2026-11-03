import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const allowedMimeTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, env.uploadDir),
  filename: (req, file, callback) => {
    const extension = allowedMimeTypes[file.mimetype];
    const filename = `${crypto.randomBytes(12).toString('hex')}.${extension}`;
    callback(null, filename);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes[file.mimetype]) {
      return callback(new HttpError(422, 'La imagen debe ser JPG, PNG o WEBP.'));
    }
    callback(null, true);
  },
});

export function removeUploadedFile(filename) {
  if (!filename) return;
  const fullPath = path.join(env.uploadDir, path.basename(filename));
  fs.promises.unlink(fullPath).catch(() => {});
}
