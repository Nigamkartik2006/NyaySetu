-- ==========================================
-- NyaySetu - Campus Grievance & Incident Reporting Platform
-- Database Schema Definition & Initial Seed Data
-- Database Name: campus_grievance
-- ==========================================

CREATE DATABASE IF NOT EXISTS campus_grievance
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE campus_grievance;

-- ==========================================
-- Table: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'official', 'admin') NOT NULL DEFAULT 'student',
  student_id VARCHAR(100) UNIQUE NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: complaints
-- ==========================================
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(50) NOT NULL UNIQUE,
  complainant_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  public_summary TEXT,
  incident_date DATE NOT NULL,
  incident_location VARCHAR(255) NOT NULL,
  people_involved TEXT,
  witness_information TEXT,
  danger_status ENUM('Yes', 'No') DEFAULT 'No',
  status ENUM('Submitted', 'Acknowledged', 'Under Investigation', 'Under Review', 'Action Taken', 'Escalated', 'Resolved', 'Closed') DEFAULT 'Submitted',
  is_escalated TINYINT(1) DEFAULT 0,
  escalated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id),
  INDEX idx_complainant_id (complainant_id),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: evidence
-- ==========================================
CREATE TABLE IF NOT EXISTS evidence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  storage_reference VARCHAR(550) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_complaint_id (complaint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Initial Seed Accounts (Inserts ONLY if missing)
-- Demo Accounts:
--   Admin:        asayusingh243@gmail.com (Password: Admin@123)
--   College Head: a789y12@gmail.com       (Password: Official@123)
-- ==========================================

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
  ),
  (
    'System Administrator',
    'admin@campusguard.edu',
    '$2a$10$0HuUOehNWzZkhWacZideZe6THESzrl5qLsknu5WCFT9Qo6asQGXpG',
    'admin',
    NULL,
    1
  ),
  (
    'Aarav Sharma',
    'student@campusguard.edu',
    '$2a$10$Fa91MZu5gpycT/.oKesM5.e80bspzFpdZmeApqcWF/5fhQHufy.se',
    'student',
    'STU-2026-001',
    1
  );

-- ==========================================
-- Table: complaint_status_history
-- ==========================================
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

-- ==========================================
-- Table: complaint_actions
-- ==========================================
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

-- ==========================================
-- Table: retaliation_reports
-- ==========================================
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

-- ==========================================
-- Table: email_logs
-- ==========================================
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

-- ==========================================
-- Table: audit_logs
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT,
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor_id (actor_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
