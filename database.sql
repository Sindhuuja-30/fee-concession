CREATE DATABASE IF NOT EXISTS fee_concession_db;
USE fee_concession_db;

-- Users Table (Student and Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Storing as plain text for simplicity as per requirements (or simple hash if preferred, but user said "keep simple")
    role ENUM('student', 'admin') NOT NULL
);

-- Fee Concession Applications Table
CREATE TABLE IF NOT EXISTS concessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Insert Dummy Data
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@college.edu', 'admin123', 'admin'),
('John Doe', 'student@college.edu', 'student123', 'student');

INSERT INTO concessions (student_id, student_name, reason, amount, status) VALUES
(2, 'John Doe', 'Financial hardship due to medical emergency', 5000.00, 'pending');
