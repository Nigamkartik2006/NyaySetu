const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const retaliationController = require('../controllers/retaliationController');

// All retaliation routes require authentication
router.use(authMiddleware);

// Student Retaliation Routes
router.post(
  '/',
  requireRole('student'),
  upload.array('evidenceFiles'),
  retaliationController.createRetaliationReport
);

router.get(
  '/my',
  requireRole('student'),
  retaliationController.getMyRetaliationReports
);

// Admin / Independent Oversight Retaliation Route
router.get(
  '/admin/all',
  requireRole('admin'),
  retaliationController.getAllRetaliationReports
);

module.exports = router;
