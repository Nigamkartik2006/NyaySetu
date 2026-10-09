const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const officialController = require('../controllers/officialController');

// All Official routes strictly require JWT Authentication AND 'official' Role
router.use(authMiddleware);
router.use(requireRole('official'));

// Top Cards Statistics & Overview
router.get('/dashboard/stats', officialController.getDashboardStats);

// Complaints List with Filters & Countdown Timers
router.get('/complaints', officialController.getComplaints);

// Detailed Case View with Student Identity & Timeline
router.get('/complaints/:caseId', officialController.getComplaintDetails);

// Exact Evidence File Stream / Download for Official Viewers
router.get('/complaints/:caseId/evidence/:evidenceId/stream', officialController.streamEvidenceFile);

// Status Management & Action Note Submission (Transaction-backed)
router.patch('/complaints/:caseId/status', officialController.updateComplaintStatus);

// College Response Tracking / Institutional Actions & Supporting Document Upload
router.post(
  '/complaints/:caseId/actions',
  upload.array('actionFiles'),
  officialController.addInstitutionalAction
);

module.exports = router;
