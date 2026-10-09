const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { calculateFileHash, uploadDir } = require('../middleware/uploadMiddleware');
const { sendImmediateDangerAlertEmail } = require('../services/emailService');

// Helper to generate unique Case ID (Format: CMP-2026-XXXXXX)
function generateCaseId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CMP-${year}-${randomNum}`;
}

/**
 * Create a new complaint with evidence upload (Student Only)
 */
async function createComplaint(req, res) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.userId || req.user.id;
    const {
      category,
      description,
      public_summary,
      incident_date,
      incident_location,
      people_involved,
      witness_information,
      danger_status,
      false_declaration_accepted
    } = req.body;

    // Validation
    if (!category || !description || !incident_date || !incident_location) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: Category, Incident Date, Location, and Description.'
      });
    }

    if (false_declaration_accepted !== 'true' && false_declaration_accepted !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm the false accusation declaration before submitting.'
      });
    }

    if (description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Complaint description cannot be empty.'
      });
    }

    await connection.beginTransaction();

    // Generate Case ID
    let caseId = generateCaseId();
    let isUnique = false;
    while (!isUnique) {
      const [existing] = await connection.query('SELECT id FROM complaints WHERE case_id = ?', [caseId]);
      if (existing.length === 0) isUnique = true;
      else caseId = generateCaseId();
    }

    // Build safe public summary (Default: Category & General Location without any personal data)
    const safePublicSummary = public_summary && public_summary.trim().length > 0
      ? public_summary.trim()
      : `Incident Category: ${category} | Location: ${incident_location}`;

    // Insert complaint record
    const [result] = await connection.query(
      `INSERT INTO complaints (
        case_id, complainant_id, category, description, public_summary,
        incident_date, incident_location, people_involved, witness_information,
        danger_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
      [
        caseId,
        userId,
        category.trim(),
        description.trim(),
        safePublicSummary,
        incident_date,
        incident_location.trim(),
        people_involved ? people_involved.trim() : null,
        witness_information ? witness_information.trim() : null,
        danger_status === 'Yes' ? 'Yes' : 'No'
      ]
    );

    const complaintId = result.insertId;

    // Process attached evidence files
    const evidenceRecords = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = file.path;
        const fileHash = await calculateFileHash(filePath);

        const [evResult] = await connection.query(
          `INSERT INTO evidence (
            complaint_id, original_filename, stored_filename, mime_type,
            file_size, file_hash, storage_reference, uploaded_by, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            complaintId,
            file.originalname,
            file.filename,
            file.mimetype,
            file.size,
            fileHash,
            filePath,
            userId
          ]
        );

        evidenceRecords.push({
          id: evResult.insertId,
          original_filename: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          file_hash: fileHash
        });
      }
    }

    await connection.commit();

    console.log(`[Complaint Created] Case ID: ${caseId}, Complainant ID: ${userId}, Attached Evidence Files: ${evidenceRecords.length}`);

    // If Immediate Danger is flagged, send immediate emergency email to higher authorities & oversight committee
    if (danger_status === 'Yes') {
      try {
        const [studentRows] = await pool.query(
          'SELECT full_name, email, student_id FROM users WHERE id = ?',
          [userId]
        );
        const student = studentRows[0] || {};

        sendImmediateDangerAlertEmail({
          caseId,
          category: category.trim(),
          incidentLocation: incident_location.trim(),
          incidentDate: incident_date,
          description: description.trim(),
          studentName: student.full_name,
          studentEmail: student.email,
          studentIdNumber: student.student_id
        }).catch((err) => console.error('[Immediate Danger Alert Email Error]:', err));
      } catch (emailErr) {
        console.error('[Error fetching user for danger alert]:', emailErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      case_id: caseId,
      complaint_id: complaintId,
      evidence_count: evidenceRecords.length
    });

  } catch (error) {
    await connection.rollback();
    console.error('[Create Complaint Error]:', error);

    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while submitting complaint.'
    });
  } finally {
    connection.release();
  }
}

/**
 * Get all complaints submitted by logged-in student (Student Only)
 */
async function getMyComplaints(req, res) {
  try {
    const userId = req.user.userId || req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        c.id, c.case_id, c.category, c.incident_date, c.incident_location,
        c.status, c.danger_status, c.created_at,
        COUNT(e.id) AS evidence_count
      FROM complaints c
      LEFT JOIN evidence e ON e.complaint_id = c.id AND e.is_active = 1
      WHERE c.complainant_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      complaints: rows
    });
  } catch (error) {
    console.error('[getMyComplaints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your complaints.'
    });
  }
}

/**
 * Get all evidence files across all complaints submitted by logged-in student (Student Only)
 */
async function getStudentEvidenceVault(req, res) {
  try {
    const userId = req.user.userId || req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        e.id, e.complaint_id, e.original_filename, e.stored_filename,
        e.mime_type, e.file_size, e.file_hash, e.uploaded_at, e.is_active,
        c.case_id, c.category AS complaint_category, c.status AS complaint_status
      FROM evidence e
      JOIN complaints c ON e.complaint_id = c.id
      WHERE c.complainant_id = ? AND e.is_active = 1
      ORDER BY e.uploaded_at DESC`,
      [userId]
    );

    const totalBytes = rows.reduce((acc, curr) => acc + Number(curr.file_size || 0), 0);

    return res.status(200).json({
      success: true,
      evidence: rows,
      stats: {
        total_files: rows.length,
        total_bytes: totalBytes
      }
    });
  } catch (error) {
    console.error('[getStudentEvidenceVault Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your evidence vault.'
    });
  }
}

/**
 * Get full private details of a specific complaint (Complainant Only)
 */
async function getPrivateComplaintByCaseId(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { caseId } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM complaints WHERE case_id = ?`,
      [caseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint case not found.'
      });
    }

    const complaint = rows[0];

    // Strictly enforce backend authorization: Student A cannot access Student B's complaint
    if (complaint.complainant_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this complaint record.'
      });
    }

    // Fetch active evidence items
    const [evidence] = await pool.query(
      `SELECT id, original_filename, stored_filename, mime_type, file_size, file_hash, uploaded_at, is_active
       FROM evidence
       WHERE complaint_id = ? AND is_active = 1
       ORDER BY uploaded_at ASC`,
      [complaint.id]
    );

    return res.status(200).json({
      success: true,
      complaint,
      evidence
    });
  } catch (error) {
    console.error('[getPrivateComplaintByCaseId Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details.'
    });
  }
}

/**
 * Download / Stream private evidence file (Complainant Only)
 */
async function downloadEvidenceFile(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { caseId, evidenceId } = req.params;

    // Fetch complaint and evidence record
    const [complaints] = await pool.query('SELECT complainant_id FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaints[0].complainant_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized evidence access.' });
    }

    const [evRows] = await pool.query('SELECT * FROM evidence WHERE id = ? AND is_active = 1', [evidenceId]);
    if (evRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evidence file not found.' });
    }

    const evidence = evRows[0];
    const filePath = path.join(uploadDir, evidence.stored_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical evidence file missing from storage.' });
    }

    return res.download(filePath, evidence.original_filename);
  } catch (error) {
    console.error('[downloadEvidenceFile Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to download evidence file.' });
  }
}

/**
 * Soft delete / deactivate evidence file prior to final resolution (Complainant Only)
 */
async function removeEvidenceFile(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { caseId, evidenceId } = req.params;

    const [complaints] = await pool.query('SELECT complainant_id FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaints[0].complainant_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    await pool.query('UPDATE evidence SET is_active = 0 WHERE id = ?', [evidenceId]);

    return res.status(200).json({
      success: true,
      message: 'Evidence file removed successfully.'
    });
  } catch (error) {
    console.error('[removeEvidenceFile Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove evidence file.' });
  }
}

/**
 * PUBLIC API: Get anonymized list of complaints (Public - No Auth Required)
 */
async function getPublicComplaints(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        case_id, category, incident_date, incident_location, status,
        public_summary, created_at, 'Anonymous Student' AS reported_by
      FROM complaints
      ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      complaints: rows
    });
  } catch (error) {
    console.error('[getPublicComplaints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve public complaints.'
    });
  }
}

/**
 * PUBLIC API: Get single anonymized case details (Public - No Auth Required)
 */
async function getPublicComplaintByCaseId(req, res) {
  try {
    const { caseId } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        case_id, category, incident_date, incident_location, status,
        public_summary, created_at, 'Anonymous Student' AS reported_by,
        'Awaiting Review' AS current_stage
      FROM complaints
      WHERE case_id = ?`,
      [caseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Public case record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      case: rows[0]
    });
  } catch (error) {
    console.error('[getPublicComplaintByCaseId Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve public case details.'
    });
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getStudentEvidenceVault,
  getPrivateComplaintByCaseId,
  downloadEvidenceFile,
  removeEvidenceFile,
  getPublicComplaints,
  getPublicComplaintByCaseId
};
