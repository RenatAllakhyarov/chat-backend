import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

// Функция для создания директорий
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Убедиться, что upload директории существуют
ensureDirExists(path.join(process.cwd(), 'uploads', 'audio'));
ensureDirExists(path.join(process.cwd(), 'uploads', 'files'));

// Настройка хранения для аудио файлов
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'audio');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Настройка хранения для других файлов
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'files');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Middleware для аудио
const uploadAudio = multer({ 
  storage: audioStorage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB максимум
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип аудио файла') as any, false);
    }
  }
});

// Middleware для других файлов
const uploadFile = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB максимум
  }
});

// Endpoint для загрузки аудио
router.post('/audio', uploadAudio.single('audio'), (req, res) => {
  try {
    if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен' });
    return;
    }

    const audioUrl = `/uploads/audio/${req.file.filename}`;
    const duration = req.body.duration ? parseInt(req.body.duration) : 0;

    res.json({
      audioUrl,
      duration,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// Endpoint для загрузки других файлов
router.post('/files', uploadFile.single('file'), (req, res) => {
  try {
    if (!req.file) {
     res.status(400).json({ error: 'Файл не загружен' });
     return;
    }

    const fileUrl = `/uploads/files/${req.file.filename}`;

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

export default router;