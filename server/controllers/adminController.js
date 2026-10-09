const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { uploadDir } = require('../middleware/uploadMiddleware');

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
      actorEmail || 'system',
      actorRole || 'admin',
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
    console.error('[AuditLog Error]: Failed to record audit event:', err.message);
  }
}

/**
 * GET /api/admin/dashboard/stats
 * Real MySQL statistics for Admin Dashboard top cards & overview
 */
async function getDashboardStats(req, res) {
  try {
    const adminUser = req.user;

    // Total cases & status breakdown query
    const [statusRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_cases,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS pending_review,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
        SUM(CASE WHEN status = 'Action Taken' THEN 1 ELSE 0 END) AS action_taken,
        SUM(CASE WHEN status = 'Escalated' THEN 1 ELSE 0 END) AS escalated,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN danger_status = 'Yes' THEN 1 ELSE 0 END) AS high_danger
      FROM complaints
    `);

    // Category breakdown query
    const [categoryRows] = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    // Recent 5 complaints query
    const [recentRows] = await pool.query(`
      SELECT 
        c.id, c.case_id, c.category, c.status, c.danger_status, c.incident_location,
        c.incident_date, c.created_at, c.updated_at,
        u.full_name AS complainant_name,
        u.student_id AS complainant_student_id,
        COUNT(e.id) AS evidence_count
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      LEFT JOIN evidence e ON e.complaint_id = c.id AND e.is_active = 1
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // Record audit log
    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VIEW_DASHBOARD_STATS',
      targetType: 'dashboard',
      ipAddress: req.ip
    });

    const stats = statusRows[0] || {
      total_cases: 0,
      pending_review: 0,
      under_review: 0,
      action_taken: 0,
      escalated: 0,
      resolved: 0,
      closed: 0,
      high_danger: 0
    };

    return res.status(200).json({
      success: true,
      stats: {
        total_cases: Number(stats.total_cases || 0),
        pending_review: Number(stats.pending_review || 0),
        under_review: Number(stats.under_review || 0),
        action_taken: Number(stats.action_taken || 0),
        escalated: Number(stats.escalated || 0),
        resolved: Number(stats.resolved || 0),
        closed: Number(stats.closed || 0),
        high_danger: Number(stats.high_danger || 0)
      },
      categories: categoryRows.map(c => ({ category: c.category, count: Number(c.count) })),
      recent_complaints: recentRows
    });

  } catch (error) {
    console.error('[getDashboardStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard statistics.'
    });
  }
}

/**
 * GET /api/admin/complaints
 * Searchable, filterable, sortable, paginated complaints list
 */
async function getComplaints(req, res) {
  try {
    const adminUser = req.user;
    const {
      search,
      category,
      status,
      danger_status,
      has_evidence,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (search && search.trim() !== '') {
      whereClause += ` AND (
        c.case_id LIKE ? OR 
        c.category LIKE ? OR 
        c.incident_location LIKE ? OR 
        c.description LIKE ? OR
        u.full_name LIKE ? OR
        u.student_id LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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

    // Allowed sort fields
    const allowedSortFields = {
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
      case_id: 'c.case_id',
      category: 'c.category',
      status: 'c.status',
      incident_date: 'c.incident_date'
    };

    const sortColumn = allowedSortFields[sort_by] || 'c.created_at';
    const direction = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT c.id) AS total
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, queryParams);
    const totalRecords = countRows[0] ? countRows[0].total : 0;

    // Having clause for evidence filter
    let havingClause = '';
    if (has_evidence === 'true') {
      havingClause = ' HAVING evidence_count > 0';
    } else if (has_evidence === 'false') {
      havingClause = ' HAVING evidence_count = 0';
    }

    // Main query
    const dataSql = `
      SELECT 
        c.id, c.case_id, c.category, c.status, c.danger_status,
        c.incident_date, c.incident_location, c.created_at, c.updated_at,
        u.full_name AS complainant_name,
        u.student_id AS complainant_student_id,
        u.email AS complainant_email,
        COUNT(e.id) AS evidence_count
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      LEFT JOIN evidence e ON e.complaint_id = c.id AND e.is_active = 1
      ${whereClause}
      GROUP BY c.id
      ${havingClause}
      ORDER BY ${sortColumn} ${direction}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...queryParams, parsedLimit, offset]);

    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VIEW_COMPLAINTS_LIST',
      targetType: 'complaints_table',
      details: { search, category, status, page, limit },
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
      }
    });

  } catch (error) {
    console.error('[getComplaints Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints list.'
    });
  }
}

/**
 * GET /api/admin/complaints/:caseId
 * Detailed view of a complaint for authorized Admin
 */
async function getComplaintDetails(req, res) {
  try {
    const adminUser = req.user;
    const { caseId } = req.params;

    // 1. Fetch Complaint & Complainant details
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        u.id AS complainant_user_id,
        u.full_name AS complainant_name,
        u.email AS complainant_email,
        u.student_id AS complainant_student_id,
        u.created_at AS complainant_registered_at
      FROM complaints c
      JOIN users u ON c.complainant_id = u.id
      WHERE c.case_id = ?
    `, [caseId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint case not found.'
      });
    }

    const complaint = rows[0];

    // 2. Fetch Evidence files
    const [evidence] = await pool.query(`
      SELECT id, original_filename, stored_filename, mime_type, file_size, file_hash, storage_reference, uploaded_at, is_active
      FROM evidence
      WHERE complaint_id = ? AND is_active = 1
      ORDER BY uploaded_at ASC
    `, [complaint.id]);

    // 3. Fetch Status History
    const [statusHistory] = await pool.query(`
      SELECT 
        h.id, h.previous_status, h.new_status, h.action_note, h.closure_reason, h.created_at,
        u.full_name AS actor_name, u.role AS actor_role
      FROM complaint_status_history h
      JOIN users u ON h.actor_id = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at DESC
    `, [complaint.id]);

    // 4. Fetch Institutional Actions
    const [actions] = await pool.query(`
      SELECT 
        a.id, a.action_type, a.action_description, a.performed_at,
        u.full_name AS actor_name, u.role AS actor_role
      FROM complaint_actions a
      JOIN users u ON a.actor_id = u.id
      WHERE a.complaint_id = ?
      ORDER BY a.performed_at DESC
    `, [complaint.id]);

    // 5. Fetch Audit Trail for this case
    const [timelineLogs] = await pool.query(`
      SELECT id, action, actor_email, actor_role, details, created_at
      FROM audit_logs
      WHERE target_id = ?
      ORDER BY created_at ASC
    `, [caseId]);

    // Record audit access
    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VIEW_COMPLAINT_DETAILS',
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
      audit_timeline: timelineLogs
    });

  } catch (error) {
    console.error('[getComplaintDetails Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve case details.'
    });
  }
}

/**
 * GET /api/admin/complaints/:caseId/evidence/:evidenceId/file
 * Stream or download exact evidence file with authentic MIME header for Admin
 */
async function streamEvidenceFile(req, res) {
  try {
    const adminUser = req.user;
    const { caseId, evidenceId } = req.params;

    // Verify complaint case
    const [complaints] = await pool.query('SELECT id FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = complaints[0];

    // Verify evidence record
    const [evRows] = await pool.query(
      'SELECT * FROM evidence WHERE id = ? AND complaint_id = ? AND is_active = 1',
      [evidenceId, complaint.id]
    );

    if (evRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const evidence = evRows[0];

    // Multi-candidate file path resolution
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
      console.error(`[Evidence File Missing] Could not locate file "${evidence.stored_filename}" for case "${caseId}"`);
      return res.status(404).json({
        success: false,
        message: `Physical evidence file "${evidence.original_filename}" is missing from server storage.`
      });
    }

    const stat = fs.statSync(filePath);

    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VIEW_EVIDENCE_FILE',
      targetType: 'evidence',
      targetId: evidenceId,
      details: { caseId, filename: evidence.original_filename },
      ipAddress: req.ip
    });

    // Stream with exact MIME header for lightbox / document viewer
    res.setHeader('Content-Type', evidence.mime_type || 'image/jpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.original_filename)}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('[streamEvidenceFile Admin Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to access evidence file.' });
  }
}

/**
 * PATCH /api/admin/complaints/:caseId/status
 * Update case status with mandatory action note inside MySQL transaction
 */
async function updateComplaintStatus(req, res) {
  const connection = await pool.getConnection();
  try {
    const adminUser = req.user;
    const { caseId } = req.params;
    const { status, action_note, closure_reason } = req.body;

    const validStatuses = ['Submitted', 'Under Review', 'Action Taken', 'Escalated', 'Resolved', 'Closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!action_note || action_note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action note or review justification is required when updating case status.'
      });
    }

    if (status === 'Closed' && (!closure_reason || closure_reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Formal closure reason is mandatory when closing a complaint.'
      });
    }

    await connection.beginTransaction();

    // Lock complaint record
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
        (adminUser.userId || adminUser.id)
      ]
    );

    // If status is Action Taken, record in complaint_actions
    if (status === 'Action Taken' || status === 'Resolved') {
      await connection.query(
        `INSERT INTO complaint_actions (
          complaint_id, actor_id, action_type, action_description
        ) VALUES (?, ?, ?, ?)`,
        [
          complaint.id,
          (adminUser.userId || adminUser.id),
          status === 'Resolved' ? 'Final Case Resolution' : 'Institutional Action Executed',
          action_note.trim()
        ]
      );
    }

    // Record audit log within transaction
    await createAuditLog(connection, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'UPDATE_CASE_STATUS',
      targetType: 'complaint',
      targetId: caseId,
      details: { previousStatus, newStatus: status, action_note: action_note.trim() },
      ipAddress: req.ip
    });

    await connection.commit();

    console.log(`[Status Updated] Case: ${caseId} | Previous: ${previousStatus} -> New: ${status} by Admin: ${adminUser.email}`);

    return res.status(200).json({
      success: true,
      message: `Case status updated successfully to "${status}".`,
      case_id: caseId,
      previous_status: previousStatus,
      new_status: status
    });

  } catch (error) {
    await connection.rollback();
    console.error('[updateComplaintStatus Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update case status.'
    });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/admin/complaints/:caseId/actions
 * Record an explicit institutional action note for College Response Tracking
 */
async function addInstitutionalAction(req, res) {
  try {
    const adminUser = req.user;
    const { caseId } = req.params;
    const { action_type, action_description } = req.body;

    if (!action_type || !action_description || action_description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action type and description are required.'
      });
    }

    const [complaints] = await pool.query('SELECT id FROM complaints WHERE case_id = ?', [caseId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint case not found.' });
    }

    const complaint = complaints[0];

    const [result] = await pool.query(
      `INSERT INTO complaint_actions (
        complaint_id, actor_id, action_type, action_description
      ) VALUES (?, ?, ?, ?)`,
      [complaint.id, (adminUser.userId || adminUser.id), action_type.trim(), action_description.trim()]
    );

    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'RECORD_INSTITUTIONAL_ACTION',
      targetType: 'complaint',
      targetId: caseId,
      details: { action_type, action_description },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Institutional action recorded successfully.',
      action_id: result.insertId
    });

  } catch (error) {
    console.error('[addInstitutionalAction Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record institutional action.'
    });
  }
}

/**
 * GET /api/admin/analytics
 * Real analytics driven by MySQL complaint data
 */
async function getAnalytics(req, res) {
  try {
    const adminUser = req.user;

    // Categories Breakdown
    const [categories] = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    // Status Breakdown
    const [statuses] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM complaints
      GROUP BY status
    `);

    // Submissions over time (last 30 days)
    const [timeline] = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM complaints
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 30
    `);

    // Danger flag breakdown
    const [dangerMetrics] = await pool.query(`
      SELECT danger_status, COUNT(*) AS count
      FROM complaints
      GROUP BY danger_status
    `);

    await createAuditLog(pool, {
      actorId: (adminUser.userId || adminUser.id),
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VIEW_ANALYTICS',
      targetType: 'analytics',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      categories,
      statuses,
      timeline,
      dangerMetrics
    });

  } catch (error) {
    console.error('[getAnalytics Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load system analytics.'
    });
  }
}

/**
 * GET /api/admin/audit-logs
 * Audit trail viewer for Admin
 */
async function getAuditLogs(req, res) {
  try {
    const adminUser = req.user;
    const { page = 1, limit = 20, search } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (search && search.trim() !== '') {
      whereClause += ' AND (action LIKE ? OR actor_email LIKE ? OR target_id LIKE ? OR details LIKE ?)';
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`, queryParams);
    const total = countRows[0] ? countRows[0].total : 0;

    const [logs] = await pool.query(
      `SELECT id, actor_id, actor_email, actor_role, action, target_type, target_id, details, ip_address, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parsedLimit, offset]
    );

    return res.status(200).json({
      success: true,
      audit_logs: logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });

  } catch (error) {
    console.error('[getAuditLogs Admin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system audit logs.'
    });
  }
}

module.exports = {
  getDashboardStats,
  getComplaints,
  getComplaintDetails,
  streamEvidenceFile,
  updateComplaintStatus,
  addInstitutionalAction,
  getAnalytics,
  getAuditLogs
};
