const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { uploadDir, calculateFileHash } = require('../middleware/uploadMiddleware');
const { RESPONSE_TIMEOUT_MINUTES } = require('../services/escalationScheduler');

// Helper to log system audit trail safely
async function createAuditLog(connectionOrPool, { actorId, actorEmail, actorRole, action, targetType, targetId, details, ipAddress }) {
  try {
    const query = `
      INSERT INTO audit_logs (
        actor_id, actor_email, actor_role, action,
        target_type, target_id, details, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      actorId || null,
      actorEmail || 'official@campusguard.edu',
      actorRole || 'official',
      action,
      targetType || 'complaint',
      targetId ? String(targetId) : null,
      typeof details === 'object' ? JSON.stringify(details) : details || null,
      ipAddress || null
    ];

    if (connectionOrPool.query) {
      await connectionOrPool.query(query, params);
    }
  } catch (err) {
    console.error('[Official AuditLog Error]:', err.message);
  }
}

/**
 * GET /api/official/dashboard/stats
 * Live metrics for College Head Dashboard
 */
async function getDashboardStats(req, res) {
  try {
    const officialUser = req.user;

    const [statusRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_cases,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS pending_review,
        SUM(CASE WHEN status IN ('Under Investigation', 'Under Review') THEN 1 ELSE 0 END) AS under_investigation,
        SUM(CASE WHEN status = 'Action Taken' THEN 1 ELSE 0 END) AS action_taken,
        SUM(CASE WHEN status = 'Escalated' OR (status = 'Submitted' AND TIMESTAMPDIFF(SECOND, created_at, NOW()) >= (? * 60)) THEN 1 ELSE 0 END) AS overdue_escalated,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN danger_status = 'Yes' THEN 1 ELSE 0 END) AS high_danger
      FROM complaints
    `, [RESPONSE_TIMEOUT_MINUTES]);

    const [categoryRows] = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    const [recentRows] = await pool.query(`
      SELECT 
        c.id, c.case_id, c.category, c.status, c.danger_status, c.incident_location,
        c.incident_date, c.created_at, c.updated_at, c.is_escalated,
        DATE_ADD(c.created_at, INTERVAL ? MINUTE) AS deadline_time,
        GREATEST(0, (? * 60) - TIMESTAMPDIFF(SECOND, c.created_at, NOW())) AS seconds_remaining,
        u.full_name AS complainant_name,
        u.student_id AS complainant_student_id,
        COUNT(e.id) AS evidence_count
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      LEFT JOIN evidence e ON e.complaint_id = c.id AND e.is_active = 1
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [RESPONSE_TIMEOUT_MINUTES, RESPONSE_TIMEOUT_MINUTES]);

    await createAuditLog(pool, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'VIEW_OFFICIAL_DASHBOARD',
      targetType: 'dashboard',
      ipAddress: req.ip
    });

    const stats = statusRows[0] || {};

    return res.status(200).json({
      success: true,
      stats: {
        total_cases: Number(stats.total_cases || 0),
        pending_review: Number(stats.pending_review || 0),
        under_investigation: Number(stats.under_investigation || 0),
        action_taken: Number(stats.action_taken || 0),
        overdue_escalated: Number(stats.overdue_escalated || 0),
        resolved: Number(stats.resolved || 0),
        high_danger: Number(stats.high_danger || 0),
        response_timeout_minutes: RESPONSE_TIMEOUT_MINUTES
      },
      categories: categoryRows.map(c => ({ category: c.category, count: Number(c.count) })),
      recent_complaints: recentRows
    });

  } catch (error) {
    console.error('[getDashboardStats Official Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve College Head metrics.'
    });
  }
}

/**
 * GET /api/official/complaints
 * Searchable, filterable complaints table for College Head
 */
async function getComplaints(req, res) {
  try {
    const officialUser = req.user;
    const {
      search,
      category,
      status,
      danger_status,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    let whereClause = 'WHERE 1=1';
    const queryParams = [RESPONSE_TIMEOUT_MINUTES, RESPONSE_TIMEOUT_MINUTES];

    if (search && search.trim() !== '') {
      whereClause += ` AND (
        c.case_id LIKE ? OR 
        c.category LIKE ? OR 
        c.incident_location LIKE ? OR 
        c.description LIKE ? OR
        u.full_name LIKE ? OR
        u.student_id LIKE ?
      )`;
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s, s, s);
    }

    if (category && category.trim() !== '') {
      whereClause += ' AND c.category = ?';
      queryParams.push(category.trim());
    }

    if (status && status.trim() !== '') {
      whereClause += ' AND c.status = ?';
      queryParams.push(status.trim());
    }

    if (danger_status && (danger_status === 'Yes' || danger_status === 'No')) {
      whereClause += ' AND c.danger_status = ?';
      queryParams.push(danger_status);
    }

    const countSql = `
      SELECT COUNT(DISTINCT c.id) AS total
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, queryParams.slice(2));
    const totalRecords = countRows[0] ? countRows[0].total : 0;

    const dataSql = `
      SELECT 
        c.id, c.case_id, c.category, c.status, c.danger_status, c.is_escalated,
        c.incident_date, c.incident_location, c.created_at, c.updated_at,
        DATE_ADD(c.created_at, INTERVAL ? MINUTE) AS deadline_time,
        GREATEST(0, (? * 60) - TIMESTAMPDIFF(SECOND, c.created_at, NOW())) AS seconds_remaining,
        u.full_name AS complainant_name,
        u.student_id AS complainant_student_id,
        u.email AS complainant_email,
        COUNT(e.id) AS evidence_count
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      LEFT JOIN evidence e ON e.complaint_id = c.id AND e.is_active = 1
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at ${sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...queryParams, parsedLimit, offset]);

    await createAuditLog(pool, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'VIEW_OFFICIAL_COMPLAINTS_LIST',
      targetType: 'complaints_table',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      complaints: rows,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(totalRecords / parsedLimit)
      },
      response_timeout_minutes: RESPONSE_TIMEOUT_MINUTES
    });

  } catch (error) {
    console.error('[getComplaints Official Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve College Head complaints list.'
    });
  }
}

/**
 * GET /api/official/complaints/:caseId
 * Detailed case view for College Head with evidence, status history, and action form
 */
async function getComplaintDetails(req, res) {
  try {
    const officialUser = req.user;
    const { caseId } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        c.*,
        DATE_ADD(c.created_at, INTERVAL ? MINUTE) AS deadline_time,
        GREATEST(0, (? * 60) - TIMESTAMPDIFF(SECOND, c.created_at, NOW())) AS seconds_remaining,
        u.id AS complainant_user_id,
        u.full_name AS complainant_name,
        u.email AS complainant_email,
        u.student_id AS complainant_student_id,
        u.created_at AS complainant_registered_at
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      WHERE c.case_id = ?
    `, [RESPONSE_TIMEOUT_MINUTES, RESPONSE_TIMEOUT_MINUTES, caseId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = rows[0];

    const [evidence] = await pool.query(`
      SELECT id, original_filename, stored_filename, mime_type, file_size, file_hash, storage_reference, uploaded_at, is_active
      FROM evidence
      WHERE complaint_id = ? AND is_active = 1
      ORDER BY uploaded_at ASC
    `, [complaint.id]);

    const [statusHistory] = await pool.query(`
      SELECT 
        h.id, h.previous_status, h.new_status, h.action_note, h.closure_reason, h.created_at,
        u.full_name AS actor_name, u.role AS actor_role
      FROM complaint_status_history h
      JOIN users u ON h.actor_id = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at DESC
    `, [complaint.id]);

    const [actions] = await pool.query(`
      SELECT 
        a.id, a.action_type, a.action_description, a.performed_at,
        u.full_name AS actor_name, u.role AS actor_role
      FROM complaint_actions a
      JOIN users u ON a.actor_id = u.id
      WHERE a.complaint_id = ?
      ORDER BY a.performed_at DESC
    `, [complaint.id]);

    await createAuditLog(pool, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'VIEW_OFFICIAL_CASE_DETAILS',
      targetType: 'complaint',
      targetId: caseId,
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      complaint: {
        id: complaint.id,
        case_id: complaint.case_id,
        category: complaint.category,
        description: complaint.description,
        public_summary: complaint.public_summary,
        incident_date: complaint.incident_date,
        incident_location: complaint.incident_location,
        people_involved: complaint.people_involved,
        witness_information: complaint.witness_information,
        danger_status: complaint.danger_status,
        status: complaint.status,
        is_escalated: complaint.is_escalated,
        deadline_time: complaint.deadline_time,
        seconds_remaining: complaint.seconds_remaining,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at
      },
      complainant: {
        id: complaint.complainant_user_id,
        full_name: complaint.complainant_name,
        email: complaint.complainant_email,
        student_id: complaint.complainant_student_id,
        registered_at: complaint.complainant_registered_at
      },
      evidence,
      status_history: statusHistory,
      institutional_actions: actions,
      response_timeout_minutes: RESPONSE_TIMEOUT_MINUTES
    });

  } catch (error) {
    console.error('[getComplaintDetails Official Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint case details.'
    });
  }
}

/**
 * GET /api/official/complaints/:caseId/evidence/:evidenceId/stream
 * Secure evidence file streaming for College Head
 */
async function streamEvidenceFile(req, res) {
  try {
    const officialUser = req.user;
    const { caseId, evidenceId } = req.params;

    const [complaints] = await pool.query('SELECT id FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = complaints[0];

    const [evRows] = await pool.query(
      'SELECT * FROM evidence WHERE id = ? AND complaint_id = ? AND is_active = 1',
      [evidenceId, complaint.id]
    );

    if (evRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const evidence = evRows[0];

    const candidatePaths = [
      path.join(uploadDir, evidence.stored_filename),
      evidence.storage_reference,
      path.resolve(evidence.storage_reference),
      path.join(__dirname, '../uploads/evidence', evidence.stored_filename),
      path.join(process.cwd(), 'uploads/evidence', evidence.stored_filename),
      path.join(process.cwd(), 'server/uploads/evidence', evidence.stored_filename)
    ];

    let filePath = null;
    for (const candidate of candidatePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ success: false, message: 'Physical evidence file missing from storage.' });
    }

    const stat = fs.statSync(filePath);

    await createAuditLog(pool, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'VIEW_OFFICIAL_EVIDENCE_FILE',
      targetType: 'evidence',
      targetId: evidenceId,
      details: { caseId, filename: evidence.original_filename },
      ipAddress: req.ip
    });

    res.setHeader('Content-Type', evidence.mime_type || 'image/jpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.original_filename)}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('[streamEvidenceFile Official Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to access evidence file.' });
  }
}

/**
 * PATCH /api/official/complaints/:caseId/status
 * Update case status with mandatory action note (College Head Authorized)
 */
async function updateComplaintStatus(req, res) {
  const connection = await pool.getConnection();
  try {
    const officialUser = req.user;
    const { caseId } = req.params;
    const { status, action_note, closure_reason } = req.body;

    const validStatuses = ['Acknowledged', 'Under Investigation', 'Under Review', 'Action Taken', 'Escalated', 'Resolved', 'Closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}`
      });
    }

    if (!action_note || action_note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action note or investigation justification is required.'
      });
    }

    if (status === 'Closed' && (!closure_reason || closure_reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Formal closure reason is mandatory when closing a complaint.'
      });
    }

    await connection.beginTransaction();

    const [complaints] = await connection.query('SELECT id, status FROM complaints WHERE case_id = ? FOR UPDATE', [caseId]);

    if (complaints.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = complaints[0];
    const previousStatus = complaint.status;

    // Update status
    await connection.query(
      'UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, complaint.id]
    );

    // Record Status History
    await connection.query(
      `INSERT INTO complaint_status_history (
        complaint_id, previous_status, new_status, action_note, closure_reason, actor_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        complaint.id,
        previousStatus,
        status,
        action_note.trim(),
        closure_reason ? closure_reason.trim() : null,
        (officialUser.userId || officialUser.id)
      ]
    );

    // Record Action Taken if applicable
    if (['Action Taken', 'Resolved', 'Under Investigation', 'Acknowledged'].includes(status)) {
      await connection.query(
        `INSERT INTO complaint_actions (
          complaint_id, actor_id, action_type, action_description
        ) VALUES (?, ?, ?, ?)`,
        [
          complaint.id,
          (officialUser.userId || officialUser.id),
          `Status Changed to ${status}`,
          action_note.trim()
        ]
      );
    }

    // Record Audit Log inside transaction
    await createAuditLog(connection, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'UPDATE_CASE_STATUS_OFFICIAL',
      targetType: 'complaint',
      targetId: caseId,
      details: { previousStatus, newStatus: status, action_note: action_note.trim() },
      ipAddress: req.ip
    });

    await connection.commit();

    console.log(`[Official Status Updated] Case ${caseId}: ${previousStatus} -> ${status} by ${officialUser.email}`);

    return res.status(200).json({
      success: true,
      message: `Case status updated successfully to "${status}".`,
      case_id: caseId,
      previous_status: previousStatus,
      new_status: status
    });

  } catch (error) {
    await connection.rollback();
    console.error('[updateComplaintStatus Official Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update case status.'
    });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/official/complaints/:caseId/actions
 * Record official investigation action & optional action evidence file
 */
async function addInstitutionalAction(req, res) {
  const connection = await pool.getConnection();
  try {
    const officialUser = req.user;
    const { caseId } = req.params;
    const { action_type, action_description } = req.body;

    if (!action_type || !action_description || action_description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action type and description are required.'
      });
    }

    await connection.beginTransaction();

    const [complaints] = await connection.query('SELECT id, status FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = complaints[0];

    // Insert action record
    const [result] = await connection.query(
      `INSERT INTO complaint_actions (
        complaint_id, actor_id, action_type, action_description
      ) VALUES (?, ?, ?, ?)`,
      [complaint.id, (officialUser.userId || officialUser.id), action_type.trim(), action_description.trim()]
    );

    // Process optional action evidence file attached by College Head
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
            `[Official Action Document] ${file.originalname}`,
            file.filename,
            file.mimetype,
            file.size,
            fileHash,
            filePath,
            (officialUser.userId || officialUser.id)
          ]
        );
      }
    }

    // Auto update status to "Under Investigation" if still in "Submitted"
    if (complaint.status === 'Submitted') {
      await connection.query(
        'UPDATE complaints SET status = "Under Investigation", updated_at = NOW() WHERE id = ?',
        [complaint.id]
      );

      await connection.query(
        `INSERT INTO complaint_status_history (
          complaint_id, previous_status, new_status, action_note, actor_id
        ) VALUES (?, 'Submitted', 'Under Investigation', ?, ?)`,
        [complaint.id, `Investigation action recorded: ${action_type}`, (officialUser.userId || officialUser.id)]
      );
    }

    await createAuditLog(connection, {
      actorId: (officialUser.userId || officialUser.id),
      actorEmail: officialUser.email,
      actorRole: officialUser.role,
      action: 'RECORD_OFFICIAL_INSTITUTIONAL_ACTION',
      targetType: 'complaint',
      targetId: caseId,
      details: { action_type, action_description: action_description.trim() },
      ipAddress: req.ip
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Official action and evidence documentation recorded successfully.',
      action_id: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('[addInstitutionalAction Official Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record official action.'
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getDashboardStats,
  getComplaints,
  getComplaintDetails,
  streamEvidenceFile,
  updateComplaintStatus,
  addInstitutionalAction
};
