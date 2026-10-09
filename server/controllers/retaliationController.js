const { pool } = require('../config/db');
const { calculateFileHash } = require('../middleware/uploadMiddleware');
const { sendRetaliationOversightEmail } = require('../services/emailService');

function generateRetaliationId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `RET-${year}-${randomNum}`;
}

/**
 * Submit Confidential Student Retaliation Report (Student Only)
 */
async function createRetaliationReport(req, res) {
  const connection = await pool.getConnection();
  try {
    const studentUser = req.user;
    const { case_id, incident_date, retaliation_type, description } = req.body;

    if (!case_id || !incident_date || !retaliation_type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required retaliation report fields: Related Case ID, Incident Date, Retaliation Type, and Description.'
      });
    }

    if (description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Retaliation description cannot be empty.'
      });
    }

    await connection.beginTransaction();

    // Verify associated complaint
    const [complaints] = await connection.query(
      'SELECT id, case_id FROM complaints WHERE case_id = ? AND complainant_id = ?',
      [case_id, (studentUser.userId || studentUser.id)]
    );

    if (complaints.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Associated complaint case #${case_id} was not found under your account.`
      });
    }

    const complaint = complaints[0];

    // Generate unique Retaliation ID
    let retaliationId = generateRetaliationId();
    let isUnique = false;
    while (!isUnique) {
      const [existing] = await connection.query('SELECT id FROM retaliation_reports WHERE retaliation_id = ?', [retaliationId]);
      if (existing.length === 0) isUnique = true;
      else retaliationId = generateRetaliationId();
    }

    // Insert retaliation report
    const [result] = await connection.query(
      `INSERT INTO retaliation_reports (
        retaliation_id, complaint_id, complainant_id, incident_date,
        retaliation_type, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Submitted')`,
      [
        retaliationId,
        complaint.id,
        (studentUser.userId || studentUser.id),
        incident_date,
        retaliation_type.trim(),
        description.trim()
      ]
    );

    const retaliationReportId = result.insertId;

    // Process attached retaliation evidence files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = file.path;
        const fileHash = await calculateFileHash(filePath);

        await connection.query(
          `INSERT INTO evidence (
            complaint_id, original_filename, stored_filename, mime_type,
            file_size, file_hash, storage_reference, uploaded_by, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            complaint.id,
            `[Retaliation Evidence] ${file.originalname}`,
            file.filename,
            file.mimetype,
            file.size,
            fileHash,
            filePath,
            (studentUser.userId || studentUser.id)
          ]
        );
      }
    }

    // Record Audit Log inside transaction
    await connection.query(
      `INSERT INTO audit_logs (
        actor_id, actor_email, actor_role, action, target_type, target_id, details
      ) VALUES (?, ?, 'student', 'SUBMIT_RETALIATION_REPORT', 'retaliation_report', ?, ?)`,
      [
        (studentUser.userId || studentUser.id),
        studentUser.email,
        retaliationId,
        JSON.stringify({
          retaliation_id: retaliationId,
          case_id: case_id,
          retaliation_type,
          incident_date
        })
      ]
    );

    await connection.commit();

    console.log(`[RETALIATION REPORT SUBMITTED] ID: ${retaliationId} for Case: ${case_id}`);

    // Fetch exact student complainant details from database
    const [userRows] = await connection.query(
      'SELECT id, full_name, email, student_id FROM users WHERE id = ?',
      [(studentUser.userId || studentUser.id)]
    );
    const dbStudent = userRows[0] || studentUser;

    // Trigger notification email to oversight recipient (thayusingh@gmail.com) from student email
    const emailResult = await sendRetaliationOversightEmail({
      retaliationId,
      caseId: case_id,
      incidentDate: incident_date,
      retaliationType: retaliation_type,
      description: description.trim(),
      studentEmail: dbStudent.email,
      studentName: dbStudent.full_name,
      studentIdNumber: dbStudent.student_id
    });

    return res.status(201).json({
      success: true,
      message: 'Retaliation report submitted confidentially to independent oversight.',
      retaliation_id: retaliationId,
      case_id: case_id,
      previewUrl: emailResult ? emailResult.previewUrl : null
    });

  } catch (error) {
    await connection.rollback();
    console.error('[createRetaliationReport Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit retaliation report.'
    });
  } finally {
    connection.release();
  }
}

/**
 * Get Student's Own Retaliation Reports (Student Only)
 */
async function getMyRetaliationReports(req, res) {
  try {
    const studentUser = req.user;

    const [rows] = await pool.query(
      `SELECT 
        r.id, r.retaliation_id, r.complaint_id, c.case_id,
        r.incident_date, r.retaliation_type, r.description,
        r.status, r.created_at
       FROM retaliation_reports r
       JOIN complaints c ON r.complaint_id = c.id
       WHERE r.complainant_id = ?
       ORDER BY r.created_at DESC`,
      [(studentUser.userId || studentUser.id)]
    );

    return res.status(200).json({
      success: true,
      retaliation_reports: rows
    });
  } catch (error) {
    console.error('[getMyRetaliationReports Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your retaliation reports.'
    });
  }
}

/**
 * Get All Retaliation Reports for Independent Oversight (Admin Only)
 */
async function getAllRetaliationReports(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        r.id, r.retaliation_id, r.incident_date, r.retaliation_type,
        r.description, r.status, r.created_at,
        c.case_id, c.category AS complaint_category,
        u.full_name AS complainant_name,
        u.student_id AS complainant_student_id,
        u.email AS complainant_email
       FROM retaliation_reports r
       JOIN complaints c ON r.complaint_id = c.id
       JOIN users u ON r.complainant_id = u.id
       ORDER BY r.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      reports: rows,
      retaliation_reports: rows
    });
  } catch (error) {
    console.error('[getAllRetaliationReports Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve oversight retaliation reports.'
    });
  }
}

module.exports = {
  createRetaliationReport,
  getMyRetaliationReports,
  getAllRetaliationReports
};
