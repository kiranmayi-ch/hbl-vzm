const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.xlsx', '.xls', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed.'));
    }
  }
});

// POST /api/uploads
router.post('/', authMiddleware, requireRole('admin', 'section_user'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const db = getConnection();
  const { report_id, module_name } = req.body;

  const result = db.prepare(
    'INSERT INTO uploads (report_id, module_name, filename, original_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(report_id, module_name, req.file.filename, req.file.originalname, req.file.path, req.user.id);

  res.json({
    message: 'File uploaded successfully.',
    file: {
      id: result.lastInsertRowid,
      filename: req.file.filename,
      original_name: req.file.originalname,
      url: `/api/uploads/${req.file.filename}`
    }
  });
});

// GET /api/uploads/:filename
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;
