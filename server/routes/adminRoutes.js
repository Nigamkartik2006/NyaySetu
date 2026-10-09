const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// All Admin routes strictly require JWT Authentication AND 'admin' Role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Top Cards Statistics & Overview
router.get('/dashboard/stats', adminController.getDashboardStats);

// Complaints List with Filters & Pagination
router.get('/complaints', adminController.getComplaints);

// Detailed Case View with Complainant Identity (Admin Only)
router.get('/complaints/:caseId', adminController.getComplaintDetails);

// Exact Evidence File Stream / Download for Admin Lightbox & Viewers
router.get('/complaints/:caseId/evidence/:evidenceId/stream', adminController.streamEvidenceFile);

// Status Management & Action Note Submission (Transaction-backed)
router.patch('/complaints/:caseId/status', adminController.updateComplaintStatus);

// College Response Tracking / Institutional Actions
router.post('/complaints/:caseId/actions', adminController.addInstitutionalAction);

// Real MySQL Analytics
router.get('/analytics', adminController.getAnalytics);

// Audit Trail Viewer
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
