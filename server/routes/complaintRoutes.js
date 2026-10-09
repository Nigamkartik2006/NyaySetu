const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const complaintController = require('../controllers/complaintController');

// All complaint management routes require student authentication
router.post(
  '/',
  authMiddleware,
  requireRole('student'),
  upload.array('evidenceFiles'),
  complaintController.createComplaint
);

router.get(
  '/my',
  authMiddleware,
  requireRole('student'),
  complaintController.getMyComplaints
);

router.get(
  '/vault/all',
  authMiddleware,
  requireRole('student'),
  complaintController.getStudentEvidenceVault
);

router.get(
  '/:caseId',
  authMiddleware,
  requireRole('student'),
  complaintController.getPrivateComplaintByCaseId
);

router.get(
  '/:caseId/evidence/:evidenceId/download',
  authMiddleware,
  requireRole('student'),
  complaintController.downloadEvidenceFile
);

router.delete(
  '/:caseId/evidence/:evidenceId',
  authMiddleware,
  requireRole('student'),
  complaintController.removeEvidenceFile
);

module.exports = router;
