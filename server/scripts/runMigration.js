const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../config/db');

async function runMigration() {
  console.log('Running database schema updates...');
  try {
    // 1. Add is_escalated column if missing
    try {
      await pool.query('ALTER TABLE complaints ADD COLUMN is_escalated TINYINT(1) DEFAULT 0 AFTER status');
      console.log('Added is_escalated column.');
    } catch (err) {
      if (!err.message.includes("Duplicate column name")) {
        console.log('is_escalated column notice:', err.message);
      }
    }

    // 2. Add escalated_at column if missing
    try {
      await pool.query('ALTER TABLE complaints ADD COLUMN escalated_at TIMESTAMP NULL AFTER is_escalated');
      console.log('Added escalated_at column.');
    } catch (err) {
      if (!err.message.includes("Duplicate column name")) {
        console.log('escalated_at column notice:', err.message);
      }
    }

    // 3. Create complaint_status_history table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaint_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        action_note TEXT NOT NULL,
        closure_reason TEXT,
        actor_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_complaint_id (complaint_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create complaint_actions table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaint_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        actor_id INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        action_description TEXT NOT NULL,
        performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_complaint_id (complaint_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Create retaliation_reports table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retaliation_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        retaliation_id VARCHAR(50) NOT NULL UNIQUE,
        complaint_id INT NOT NULL,
        complainant_id INT NOT NULL,
        incident_date DATE NOT NULL,
        retaliation_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('Submitted', 'Under Oversight Review', 'Action Initiated', 'Resolved') DEFAULT 'Submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_retaliation_id (retaliation_id),
        INDEX idx_complaint_id (complaint_id),
        INDEX idx_complainant_id (complainant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Create email_logs table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id VARCHAR(50),
        email_type VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('SENT', 'FAILED', 'SIMULATED') NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_case_id (case_id),
        INDEX idx_recipient (recipient)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Insert/Update demo accounts
    await pool.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, student_id, is_active)
      VALUES 
        (
          'Campus Oversight Admin',
          'asayusingh243@gmail.com',
          '$2a$10$3BXChuMalYGDiY6hqPOS2eT64FnmiWhVuu5UWIAijp9ime7YnFh/2',
          'admin',
          NULL,
          1
        ),
        (
          'College Head Official',
          'a789y12@gmail.com',
          '$2a$10$2LchDhdfH23OC85xLB30V.0bWjq4X5whdFdD33PhZQe/gOuzzIdNG',
          'official',
          NULL,
          1
        )
    `);

    console.log('Database schema migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
