const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

// Public endpoints for viewing anonymized cases
router.get('/complaints', complaintController.getPublicComplaints);
router.get('/complaints/:caseId', complaintController.getPublicComplaintByCaseId);

module.exports = router;
