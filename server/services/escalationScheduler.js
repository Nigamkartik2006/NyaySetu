const { pool } = require('../config/db');
const { sendEscalationEmail } = require('./emailService');

const RESPONSE_TIMEOUT_MINUTES = parseInt(process.env.COMPLAINT_RESPONSE_TIMEOUT_MINUTES || '1440', 10);
const SCHEDULER_INTERVAL_MS = 15000; // Check every 15 seconds

let isRunning = false;

/**
 * Check for complaints that exceeded the response deadline without an official response
 */
async function checkAndEscalateOverdueComplaints() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Query overdue unresponded complaints
    // Timeout calculation: created_at + INTERVAL ? MINUTE < NOW()
    const [overdueRows] = await pool.query(
      `SELECT 
        id, case_id, category, status, danger_status, created_at,
        DATE_ADD(created_at, INTERVAL ? MINUTE) AS deadline_time
       FROM complaints
       WHERE status = 'Submitted'
         AND is_escalated = 0
         AND TIMESTAMPDIFF(SECOND, created_at, NOW()) >= (? * 60)`,
      [RESPONSE_TIMEOUT_MINUTES, RESPONSE_TIMEOUT_MINUTES]
    );

    if (overdueRows.length === 0) {
      isRunning = false;
      return;
    }

    console.log(`[Escalation Scheduler] Found ${overdueRows.length} overdue complaint(s) exceeding ${RESPONSE_TIMEOUT_MINUTES}-minute deadline.`);

    // Fetch system admin ID for audit trail
    const [adminRows] = await pool.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
    const systemActorId = adminRows[0] ? adminRows[0].id : 1;

    for (const caseRecord of overdueRows) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Lock row and double check status
        const [lockRows] = await connection.query(
          `SELECT id, status, is_escalated FROM complaints WHERE id = ? FOR UPDATE`,
          [caseRecord.id]
        );

        if (lockRows.length === 0 || lockRows[0].status !== 'Submitted' || lockRows[0].is_escalated === 1) {
          await connection.rollback();
          connection.release();
          continue;
        }

        // Update complaint status to Escalated and mark is_escalated = 1
        await connection.query(
          `UPDATE complaints 
           SET status = 'Escalated', is_escalated = 1, escalated_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [caseRecord.id]
        );

        // Record Status History
        await connection.query(
          `INSERT INTO complaint_status_history (
            complaint_id, previous_status, new_status, action_note, actor_id
          ) VALUES (?, 'Submitted', 'Escalated', ?, ?)`,
          [
            caseRecord.id,
            `Automated System Escalation: Response deadline (${RESPONSE_TIMEOUT_MINUTES} min) exceeded without official response.`,
            systemActorId
          ]
        );

        // Record Audit Log
        await connection.query(
          `INSERT INTO audit_logs (
            actor_id, actor_email, actor_role, action, target_type, target_id, details
          ) VALUES (?, 'system.escalation@campusguard.edu', 'system', 'AUTO_ESCALATE_DEADLINE_EXPIRED', 'complaint', ?, ?)`,
          [
            systemActorId,
            caseRecord.case_id,
            JSON.stringify({
              case_id: caseRecord.case_id,
              submitted_at: caseRecord.created_at,
              deadline_minutes: RESPONSE_TIMEOUT_MINUTES,
              reason: 'No official acknowledgment or action recorded before deadline expiry'
            })
          ]
        );

        await connection.commit();
        connection.release();

        console.log(`[ESCALATED] Case ${caseRecord.case_id} automatically escalated.`);

        // Send Escalation Email to recipient
        await sendEscalationEmail({
          caseId: caseRecord.case_id,
          category: caseRecord.category,
          submissionTime: caseRecord.created_at,
          status: 'Escalated',
          expiryTime: caseRecord.deadline_time
        });

      } catch (err) {
        await connection.rollback();
        connection.release();
        console.error(`[Escalation Scheduler Error] Failed for case ${caseRecord.case_id}:`, err);
      }
    }

  } catch (error) {
    console.error('[Escalation Scheduler Error]:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the background escalation scheduler timer
 */
function startEscalationScheduler() {
  console.log(`[Escalation Scheduler] Initialized with ${RESPONSE_TIMEOUT_MINUTES}-minute deadline (Checking every 15s).`);
  
  // Run initial check
  checkAndEscalateOverdueComplaints();

  // Schedule recurring interval
  setInterval(checkAndEscalateOverdueComplaints, SCHEDULER_INTERVAL_MS);
}

module.exports = {
  startEscalationScheduler,
  checkAndEscalateOverdueComplaints,
  RESPONSE_TIMEOUT_MINUTES
};
