import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirExists(path.join(process.cwd(), 'uploads', 'audio'));
ensureDirExists(path.join(process.cwd(), 'uploads', 'files'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = file.fieldname === 'audio' ? 'audio' : 'files';
    const dir = path.join(process.cwd(), 'uploads', uploadType);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadAudio = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg',  
      'audio/wav',   
      'audio/ogg',   
      'audio/aac',   
      'audio/x-m4a', 
      'audio/mp4',   
      'audio/webm'   
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type is not supported: ${file.mimetype}`));
    }
  }
}).single('audio'); 

const uploadFiles = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
}).single('file'); 

router.post('/audio', (req, res) => {
  uploadAudio(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is not downloaded' });
    }

    const audioUrl = `/uploads/audio/${req.file.filename}`;
    const duration = req.body.duration ? parseInt(req.body.duration) : 0;

    res.json({
      success: true,
      audioUrl,
      duration,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  });
});

router.post('/files', (req, res) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is not downloaded' });
    }

    const fileUrl = `/uploads/files/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  });
});

export default router;