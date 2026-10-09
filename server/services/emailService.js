const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

// Read SMTP configuration from environment variables
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const isSmtpConfigured = Boolean(smtpUser && smtpPass);

let realTransporter = null;
let testTransporter = null;

if (isSmtpConfigured) {
  realTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

async function getActiveTransporter() {
  if (isSmtpConfigured && realTransporter) {
    return { transporter: realTransporter, isReal: true };
  }

  if (!testTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[Ethereal Test Mailer] Generated live test account: ${testAccount.user}`);
    } catch (err) {
      console.error('[Ethereal Account Creation Error]:', err.message);
      return { transporter: null, isReal: false };
    }
  }

  return { transporter: testTransporter, isReal: false };
}

/**
 * Log email delivery result to MySQL email_logs table
 */
async function logEmailResult({ caseId, emailType, recipient, subject, status, errorMessage }) {
  try {
    await pool.query(
      `INSERT INTO email_logs (case_id, email_type, recipient, subject, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caseId || null, emailType, recipient, subject, status, errorMessage || null]
    );
  } catch (err) {
    console.error('[logEmailResult Error]:', err.message);
  }
}

/**
 * Send Complaint Deadline Escalation Email
 */
async function sendEscalationEmail({ caseId, category, submissionTime, status, expiryTime }) {
  const recipient = process.env.ESCALATION_EMAIL_RECIPIENT || 'k525ing@gmail.com';
  const subject = `CampusGuard Official Escalation — Case ${caseId}`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const secureCaseLink = `${clientUrl}/admin/complaints/${caseId}`;

  const textBody = `
====================================================
CAMPUSGUARD — AUTOMATED COMPLAINT ESCALATION NOTICE
====================================================

Attention Oversight Authority,

Complaint Case #${caseId} has exceeded its response deadline without an official acknowledgment or institutional action.

CASE METRICS:
----------------------------------------------------
• Case ID:            ${caseId}
• Incident Category:  ${category}
• Submission Time:    ${new Date(submissionTime).toLocaleString('en-IN')}
• Deadline Expiry:    ${new Date(expiryTime).toLocaleString('en-IN')}
• Status:             ${status} -> ESCALATED
----------------------------------------------------

EXPLANATION:
This case has been automatically escalated to higher oversight because no qualifying response was recorded within the designated 24-hour deadline window.

SECURE DASHBOARD ACCESS:
To review full complaint details, witnesses, and uploaded evidence, log in securely at:
${secureCaseLink}

Note: For student safety and privacy, private evidence files and complainant identity are not attached to email transmissions.

====================================================
CampusGuard System Governance & Institutional Oversight
  `;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2d7cd; border-radius: 12px; overflow: hidden; background-color: #FBF7F7;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">CAMPUSGUARD ESCALATION NOTICE</h2>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #EE712B; font-weight: bold;">Automated Response Deadline Exceeded</p>
      </div>

      <div style="padding: 25px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p><strong>Attention Oversight Authority,</strong></p>
        <p>Complaint case <strong>#${caseId}</strong> has exceeded its institutional response deadline without an official acknowledgment or recorded action.</p>

        <div style="background-color: #ffffff; border: 1px solid #e2d7cd; border-left: 4px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Case ID:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0f172a;">${caseId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Category:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Submission Time:</td>
              <td style="padding: 6px 0; font-family: monospace;">${new Date(submissionTime).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Deadline Expiry:</td>
              <td style="padding: 6px 0; font-family: monospace; color: #dc2626; font-weight: bold;">${new Date(expiryTime).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569;">
          <strong>Explanation:</strong> This case was automatically marked <em>Escalated</em> because no official acknowledgment or investigation action was recorded within the designated deadline.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${secureCaseLink}" style="background-color: #EE712B; color: white; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
            Open Secure Case Dashboard →
          </a>
        </div>
      </div>

      <div style="background-color: #f1e9e3; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2d7cd;">
        CampusGuard &copy; ${new Date().getFullYear()} — Institutional Oversight & Accountability Mechanism
      </div>
    </div>
  `;

  try {
    const { transporter: activeTransporter, isReal } = await getActiveTransporter();
    
    if (!activeTransporter) {
      await logEmailResult({
        caseId,
        emailType: 'ESCALATION_EMAIL',
        recipient,
        subject,
        status: 'SIMULATED',
        errorMessage: 'No mail transporter available. Recorded in audit logs.'
      });
      return { success: true, simulated: true };
    }

    const info = await activeTransporter.sendMail({
      from: `"CampusGuard Platform" <${isReal ? smtpUser : 'no-reply@campusguard.edu'}>`,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody
    });

    const previewUrl = !isReal ? nodemailer.getTestMessageUrl(info) : null;

    if (previewUrl) {
      console.log(`\n====================================================`);
      console.log(`📧 [LIVE ESCALATION EMAIL PREVIEW LINK]:`);
      console.log(`👉 ${previewUrl}`);
      console.log(`====================================================\n`);
    }

    console.log(`[ESCALATION EMAIL SENT] Case ${caseId} to ${recipient} (Message ID: ${info.messageId})`);
    await logEmailResult({
      caseId,
      emailType: 'ESCALATION_EMAIL',
      recipient,
      subject,
      status: isReal ? 'SENT' : 'SIMULATED',
      errorMessage: previewUrl ? `Live Preview: ${previewUrl}` : null
    });

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[ESCALATION EMAIL FAILED] Case ${caseId}:`, err.message);
    await logEmailResult({
      caseId,
      emailType: 'ESCALATION_EMAIL',
      recipient,
      subject,
      status: 'FAILED',
      errorMessage: err.message
    });

    return { success: false, error: err.message };
  }
}

/**
 * Send Student Retaliation Oversight Notification Email
 */
async function sendRetaliationOversightEmail({ 
  retaliationId, 
  caseId, 
  incidentDate, 
  retaliationType, 
  description,
  studentEmail,
  studentName,
  studentIdNumber
}) {
  const recipient = process.env.OVERSIGHT_EMAIL_RECIPIENT || 'k525ing@gmail.com';
  const senderEmail = studentEmail || 'student@campusguard.edu';
  const senderName = studentName || 'Complainant Student';
  const subject = `CampusGuard Retaliation Report — Related Case ${caseId}`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const secureLink = `${clientUrl}/admin/retaliation`;

  const textBody = `
====================================================
CAMPUSGUARD — RETALIATION REPORT OVERSIGHT NOTICE
====================================================

Attention System Oversight Administrator,

A confidential Retaliation Report has been submitted regarding Case #${caseId}.

STUDENT COMPLAINANT INFORMATION:
----------------------------------------------------
• Student Name:      ${senderName}
• Student Email:     ${senderEmail}
• Student ID Number: ${studentIdNumber || 'N/A'}
----------------------------------------------------

REPORT METRICS:
----------------------------------------------------
• Retaliation Report ID: ${retaliationId}
• Associated Case ID:    ${caseId}
• Retaliation Type:      ${retaliationType}
• Incident Date:         ${new Date(incidentDate).toLocaleDateString('en-IN')}
• Target Recipient:      ${recipient}
• Status:                Submitted -> Under Oversight Review
----------------------------------------------------

DESCRIPTION SUMMARY:
"${description}"

SECURE OVERSIGHT DASHBOARD:
Log in to review retaliation evidence and initiate independent oversight action:
${secureLink}

====================================================
CampusGuard Independent Oversight Channel
  `;

  try {
    const { transporter: activeTransporter, isReal } = await getActiveTransporter();
    
    if (!activeTransporter) {
      await logEmailResult({
        caseId,
        emailType: 'RETALIATION_OVERSIGHT_EMAIL',
        recipient,
        subject,
        status: 'SIMULATED',
        errorMessage: 'No mail transporter available. Recorded in audit logs.'
      });
      return { success: true, simulated: true };
    }

    const info = await activeTransporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipient,
      subject,
      text: textBody
    });

    const previewUrl = !isReal ? nodemailer.getTestMessageUrl(info) : null;

    if (previewUrl) {
      console.log(`\n====================================================`);
      console.log(`🛡️ [LIVE RETALIATION EMAIL PREVIEW LINK]:`);
      console.log(`👉 ${previewUrl}`);
      console.log(`====================================================\n`);
    }

    console.log(`[RETALIATION EMAIL SENT] Report ${retaliationId} to ${recipient}`);
    await logEmailResult({
      caseId,
      emailType: 'RETALIATION_OVERSIGHT_EMAIL',
      recipient,
      subject,
      status: isReal ? 'SENT' : 'SIMULATED',
      errorMessage: previewUrl ? `Live Preview: ${previewUrl}` : null
    });

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[RETALIATION EMAIL FAILED] Report ${retaliationId}:`, err.message);
    await logEmailResult({
      caseId,
      emailType: 'RETALIATION_OVERSIGHT_EMAIL',
      recipient,
      subject,
      status: 'FAILED',
      errorMessage: err.message
    });

    return { success: false, error: err.message };
  }
}

/**
 * Send Immediate Danger Emergency Alert Email to Higher Authorities
 */
async function sendImmediateDangerAlertEmail({
  caseId,
  category,
  incidentLocation,
  incidentDate,
  description,
  studentName,
  studentEmail,
  studentIdNumber
}) {
  const recipient = process.env.OVERSIGHT_EMAIL_RECIPIENT || process.env.ESCALATION_EMAIL_RECIPIENT || 'k525ing@gmail.com';
  const senderEmail = studentEmail || 'student@nyaysetu.edu';
  const senderName = studentName || 'Complainant Student';
  const subject = `🚨 URGENT EMERGENCY ALERT: Immediate Danger Reported — Case ${caseId}`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const secureLink = `${clientUrl}/admin/complaints/${caseId}`;

  const textBody = `
====================================================
🚨 URGENT EMERGENCY ALERT — IMMEDIATE DANGER REPORTED
====================================================

ATTENTION HIGHER AUTHORITIES & OVERSIGHT COMMITTEE:

A student has reported a complaint with the IMMEDIATE DANGER / PHYSICAL SAFETY RISK flag enabled.

COMPLAINANT STUDENT INFORMATION:
----------------------------------------------------
• Student Name:      ${senderName}
• Student Email:     ${senderEmail}
• Student ID Number: ${studentIdNumber || 'N/A'}
----------------------------------------------------

INCIDENT METRICS:
----------------------------------------------------
• Case ID:            ${caseId}
• Incident Category:  ${category}
• Incident Location:  ${incidentLocation}
• Incident Date:      ${new Date(incidentDate).toLocaleDateString('en-IN')}
• Flagged Status:     🚨 YES (IMMEDIATE DANGER REPORTED)
----------------------------------------------------

INCIDENT DESCRIPTION:
"${description}"

URGENT ACTION REQUIRED:
Please review this emergency case immediately on the admin oversight portal:
${secureLink}

====================================================
NyaySetu Immediate Emergency Escalation Channel
  `;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #dc2626; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">🚨 URGENT EMERGENCY ALERT</h1>
        <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold;">IMMEDIATE DANGER / PHYSICAL THREAT REPORTED</p>
      </div>

      <div style="padding: 20px; color: #1e293b; line-height: 1.5; font-size: 14px;">
        <p style="margin-top: 0;"><strong>Attention Higher Authorities & Oversight Committee,</strong></p>
        <p>A student has just submitted a complaint with the <strong style="color: #dc2626;">Immediate Danger / Safety Risk Flag</strong> set to <strong>YES</strong>.</p>

        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #991b1b; text-transform: uppercase;">Complainant Student Information</h3>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Student Name:</strong> ${senderName}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Student Email:</strong> <a href="mailto:${senderEmail}" style="color: #dc2626;">${senderEmail}</a></p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Student ID:</strong> ${studentIdNumber || 'N/A'}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; margin: 15px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #334155; text-transform: uppercase;">Incident Details</h3>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Case ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #dc2626;">${caseId}</span></p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Incident Location:</strong> ${incidentLocation}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Incident Date:</strong> ${new Date(incidentDate).toLocaleDateString('en-IN')}</p>
          <p style="margin: 8px 0 3px 0; font-size: 13px;"><strong>Description:</strong></p>
          <p style="margin: 0; font-style: italic; font-size: 12px; color: #475569;">"${description}"</p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${secureLink}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px;">
            Access Admin Oversight Case File
          </a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        NyaySetu Emergency Alert System &copy; ${new Date().getFullYear()} — Urgent Safety Protection Protocol
      </div>
    </div>
  `;

  try {
    const { transporter: activeTransporter, isReal } = await getActiveTransporter();

    if (!activeTransporter) {
      await logEmailResult({
        caseId,
        emailType: 'IMMEDIATE_DANGER_ALERT',
        recipient,
        subject,
        status: 'SIMULATED',
        errorMessage: 'No mail transporter available.'
      });
      return { success: true, simulated: true };
    }

    const info = await activeTransporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody
    });

    console.log(`[IMMEDIATE DANGER ALERT SENT] Case ${caseId} to ${recipient} (Message ID: ${info.messageId})`);
    await logEmailResult({
      caseId,
      emailType: 'IMMEDIATE_DANGER_ALERT',
      recipient,
      subject,
      status: isReal ? 'SENT' : 'SIMULATED',
      errorMessage: null
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[IMMEDIATE DANGER ALERT FAILED] Case ${caseId}:`, err.message);
    await logEmailResult({
      caseId,
      emailType: 'IMMEDIATE_DANGER_ALERT',
      recipient,
      subject,
      status: 'FAILED',
      errorMessage: err.message
    });
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendEscalationEmail,
  sendRetaliationOversightEmail,
  sendImmediateDangerAlertEmail
};
