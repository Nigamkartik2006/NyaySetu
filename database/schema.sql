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
  status ENUM('Submitted', 'Under Review', 'Action Taken', 'Escalated', 'Resolved', 'Closed') DEFAULT 'Submitted',
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
-- Passwords:
--   Admin:    Admin@123
--   Official: Official@123
--   Student:  Student@123
-- ==========================================

INSERT IGNORE INTO users (full_name, email, password_hash, role, student_id, is_active)
VALUES 
  (
    'System Administrator',
    'admin@campusguard.edu',
    '$2a$10$qz3fGxo5EJrt7iNVa01tNOYEsxlpBIYwrxViYvf.9Cy5SBeEvBK5m',
    'admin',
    NULL,
    1
  ),
  (
    'Dr. Evelyn Vance',
    'official@campusguard.edu',
    '$2a$10$QBB6Qhdu7PJQrJb54zMQIOqKdK4pL0zT44Ao4ev511wBn9.DA3yqC',
    'official',
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
