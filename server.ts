import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('lms.db');

// Initialize Database Schema
db.exec(`
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS vendors;
  DROP TABLE IF EXISTS colleges;
  DROP TABLE IF EXISTS courses;
  DROP TABLE IF EXISTS materials;
  DROP TABLE IF EXISTS questions;
  DROP TABLE IF EXISTS assessments;
  DROP TABLE IF EXISTS assessment_questions;
  DROP TABLE IF EXISTS enrollments;
  DROP TABLE IF EXISTS student_profiles;
  DROP TABLE IF EXISTS aptitude_scores;
  DROP TABLE IF EXISTS placement_status;
  DROP TABLE IF EXISTS assessment_results;
  DROP TABLE IF EXISTS question_responses;
  DROP TABLE IF EXISTS assignments;
  DROP TABLE IF EXISTS assignment_submissions;
  DROP TABLE IF EXISTS attendance;
  DROP TABLE IF EXISTS material_access;
  DROP TABLE IF EXISTS login_activity;
  DROP TABLE IF EXISTS learning_activity;
  DROP TABLE IF EXISTS certifications;
  DROP TABLE IF EXISTS mock_interviews;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    college_id INTEGER,
    vendor_id INTEGER,
    trainer_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT
  );

  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    spoc_name TEXT,
    spoc_email TEXT,
    address TEXT,
    city TEXT,
    state TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    trainer_id INTEGER,
    vendor_id INTEGER,
    category TEXT,
    level TEXT -- Beginner, Intermediate, Advanced
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    type TEXT, -- video, ppt, pdf, text, image
    title TEXT,
    content TEXT,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    difficulty TEXT,
    type TEXT, -- MCQ, TF, SA
    question TEXT,
    options TEXT, -- JSON string for MCQ
    correct_answer TEXT
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    duration INTEGER, -- minutes
    passing_marks INTEGER
  );

  CREATE TABLE IF NOT EXISTS assessment_questions (
    assessment_id INTEGER,
    question_id INTEGER,
    PRIMARY KEY (assessment_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    progress INTEGER DEFAULT 0,
    batch TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_profiles (
    student_id INTEGER PRIMARY KEY,
    gender TEXT,
    dob TEXT,
    phone TEXT,
    address TEXT,
    department TEXT,
    batch TEXT,
    tenth_percent REAL,
    twelfth_percent REAL,
    degree TEXT,
    cgpa REAL,
    backlogs INTEGER,
    academic_history TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS aptitude_scores (
    student_id INTEGER PRIMARY KEY,
    logical REAL,
    quant REAL,
    verbal REAL,
    programming REAL,
    communication REAL,
    mock_interview REAL,
    coding_challenges INTEGER
  );

  CREATE TABLE IF NOT EXISTS placement_status (
    student_id INTEGER PRIMARY KEY,
    company_name TEXT,
    package REAL,
    status TEXT, -- interested, applied, interview, placed, rejected
    interview_date TEXT,
    offer_letter_status TEXT,
    resume_uploaded BOOLEAN DEFAULT 0,
    resume_updated_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS assessment_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    assessment_id INTEGER,
    score INTEGER,
    total_marks INTEGER,
    passed BOOLEAN,
    attempt_number INTEGER DEFAULT 1,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS question_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id INTEGER,
    question_id INTEGER,
    student_answer TEXT,
    is_correct BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    description TEXT,
    due_date DATETIME
  );

  CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER,
    student_id INTEGER,
    score INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    student_id INTEGER,
    session_name TEXT,
    date TEXT,
    status TEXT -- present, absent
  );

  CREATE TABLE IF NOT EXISTS material_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    material_id INTEGER,
    watch_time INTEGER DEFAULT 0, -- in seconds
    completion_percent INTEGER DEFAULT 0,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS login_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  );

  CREATE TABLE IF NOT EXISTS learning_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    activity_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    certificate_id TEXT,
    completion_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mock_interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    interview_date TEXT,
    score REAL,
    feedback TEXT
  );
`);

// Seed initial data
const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  // Vendors
  db.prepare('INSERT INTO vendors (name) VALUES (?)').run('TechSkills Solutions');
  db.prepare('INSERT INTO vendors (name) VALUES (?)').run('Global Edu Corp');
  db.prepare('INSERT INTO vendors (name) VALUES (?)').run('EduVantage Systems');

  // Colleges
  db.prepare('INSERT INTO colleges (name, spoc_name, spoc_email) VALUES (?, ?, ?)').run('National Institute of Tech', 'Dr. Smith', 'smith@nit.edu');
  db.prepare('INSERT INTO colleges (name, spoc_name, spoc_email) VALUES (?, ?, ?)').run('City Engineering College', 'Prof. Jane', 'jane@cityeng.edu');
  db.prepare('INSERT INTO colleges (name, spoc_name, spoc_email) VALUES (?, ?, ?)').run('State University of Engineering', 'Dr. Robert', 'robert@stateuni.edu');

  // Users
  db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run('admin@lms.com', 'admin123', 'admin', 'System Admin');
  db.prepare('INSERT INTO users (email, password, role, name, vendor_id) VALUES (?, ?, ?, ?, ?)').run('vendor@lms.com', 'vendor123', 'vendor', 'TechSkills Admin', 1);
  db.prepare('INSERT INTO users (email, password, role, name, vendor_id) VALUES (?, ?, ?, ?, ?)').run('vendor2@lms.com', 'vendor123', 'vendor', 'GlobalEdu Admin', 2);
  db.prepare('INSERT INTO users (email, password, role, name, vendor_id) VALUES (?, ?, ?, ?, ?)').run('trainer@lms.com', 'trainer123', 'trainer', 'John Trainer', 1);
  db.prepare('INSERT INTO users (email, password, role, name, vendor_id) VALUES (?, ?, ?, ?, ?)').run('trainer2@lms.com', 'trainer123', 'trainer', 'Alice Smith', 2);
  db.prepare('INSERT INTO users (email, password, role, name, college_id) VALUES (?, ?, ?, ?, ?)').run('college@lms.com', 'college123', 'college', 'NIT SPOC', 1);
  db.prepare('INSERT INTO users (email, password, role, name, college_id) VALUES (?, ?, ?, ?, ?)').run('college2@lms.com', 'college123', 'college', 'CEC SPOC', 2);

  const studentNames = [
    'Alex Johnson', 'Sarah Williams', 'Michael Brown', 'Emily Davis', 
    'James Wilson', 'Olivia Taylor', 'Robert Martinez', 'Sophia Anderson',
    'William Thomas', 'Isabella Garcia', 'David Moore', 'Mia Hernandez',
    'Joseph Young', 'Charlotte King', 'Charles Wright', 'Amelia Scott'
  ];

  studentNames.forEach((name, i) => {
    const college_id = (i % 3) + 1;
    db.prepare('INSERT INTO users (email, password, role, name, college_id) VALUES (?, ?, ?, ?, ?)').run(
      `student${i + 1}@lms.com`, 'student123', 'student', name, college_id
    );
  });

  // Courses
  db.prepare('INSERT INTO courses (name, description, duration, trainer_id, vendor_id) VALUES (?, ?, ?, ?, ?)').run('Full Stack Development', 'Comprehensive MERN stack bootcamp', '12 Weeks', 4, 1);
  db.prepare('INSERT INTO courses (name, description, duration, trainer_id, vendor_id) VALUES (?, ?, ?, ?, ?)').run('Data Science & AI', 'Python, Pandas, Scikit-learn and Neural Networks', '16 Weeks', 5, 2);
  db.prepare('INSERT INTO courses (name, description, duration, trainer_id, vendor_id) VALUES (?, ?, ?, ?, ?)').run('Cloud Architecture', 'AWS, Azure and GCP cloud solutions', '10 Weeks', 4, 1);
  db.prepare('INSERT INTO courses (name, description, duration, trainer_id, vendor_id) VALUES (?, ?, ?, ?, ?)').run('Cyber Security', 'Network security and ethical hacking', '8 Weeks', 5, 2);

  // Materials
  const materialTypes = ['video', 'pdf', 'ppt', 'text'];
  for (let c = 1; c <= 4; c++) {
    for (let m = 1; m <= 8; m++) {
      const type = materialTypes[m % 4];
      db.prepare('INSERT INTO materials (course_id, type, title, content, sort_order) VALUES (?, ?, ?, ?, ?)').run(
        c, type, `Module ${m}: ${type.toUpperCase()} Content`, `Sample content for ${type} in course ${c}. This is a more detailed description for module ${m}.`, m
      );
    }
  }

  // Assessments
  for (let c = 1; c <= 4; c++) {
    db.prepare('INSERT INTO assessments (course_id, title, duration, passing_marks) VALUES (?, ?, ?, ?)').run(c, `Final Assessment - Course ${c}`, 60, 70);
    db.prepare('INSERT INTO assessments (course_id, title, duration, passing_marks) VALUES (?, ?, ?, ?)').run(c, `Mid-term Quiz - Course ${c}`, 30, 60);
    db.prepare('INSERT INTO assessments (course_id, title, duration, passing_marks) VALUES (?, ?, ?, ?)').run(c, `Weekly Practice Test ${c}`, 15, 50);
  }

  // Questions
  const topics = ['React', 'Node.js', 'Python', 'AWS', 'Security'];
  topics.forEach(topic => {
    for (let q = 1; q <= 5; q++) {
      db.prepare('INSERT INTO questions (topic, difficulty, type, question, options, correct_answer) VALUES (?, ?, ?, ?, ?, ?)').run(
        topic, q % 2 === 0 ? 'Medium' : 'Easy', 'MCQ', `Sample Question ${q} for ${topic}?`, 
        JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']), 'Option A'
      );
    }
  });

  // Student Profiles, Aptitude, Placement
  const depts = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
  const batches = ['2024', '2025'];
  const companies = ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Accenture'];
  const statuses = ['placed', 'interview', 'applied', 'rejected', 'interested'];

  for (let s = 8; s <= 23; s++) {
    const dept = depts[s % 5];
    const batch = batches[s % 2];
    const cgpa = (7.0 + Math.random() * 2.5).toFixed(2);
    
    // Profile
    db.prepare(`INSERT INTO student_profiles 
      (student_id, gender, dob, phone, address, department, batch, tenth_percent, twelfth_percent, degree, cgpa, backlogs, academic_history) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        s, s % 2 === 0 ? 'Male' : 'Female', '2002-01-01', `90000000${s}`, `${s} Main St`, dept, batch, 
        85 + Math.random() * 10, 80 + Math.random() * 15, 'B.Tech', cgpa, s % 10 === 0 ? 1 : 0, '[]'
      );

    // Aptitude
    db.prepare(`INSERT INTO aptitude_scores 
      (student_id, logical, quant, verbal, programming, communication, mock_interview, coding_challenges) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        s, 60 + Math.random() * 40, 60 + Math.random() * 40, 60 + Math.random() * 40, 
        50 + Math.random() * 50, 70 + Math.random() * 30, 65 + Math.random() * 35, Math.floor(Math.random() * 30)
      );

    // Placement (for some)
    if (s % 3 === 0) {
      const status = statuses[s % 5];
      db.prepare(`INSERT INTO placement_status (student_id, company_name, package, status, interview_date, offer_letter_status, resume_uploaded, resume_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        s, companies[s % 7], status === 'placed' ? (4.0 + Math.random() * 15.0).toFixed(1) : null, status, 
        '2024-03-15', status === 'placed' ? 'received' : 'none', 1, '2024-01-01'
      );
    }

    // Enrollments
    db.prepare('INSERT INTO enrollments (student_id, course_id, progress, batch) VALUES (?, ?, ?, ?)').run(s, (s % 4) + 1, Math.floor(Math.random() * 100), batch);
  }

  // Attendance & Activity
  for (let i = 1; i <= 50; i++) {
    const student_id = 8 + (i % 16);
    db.prepare('INSERT INTO attendance (course_id, student_id, session_name, date, status) VALUES (?, ?, ?, ?, ?)').run(
      (i % 4) + 1, student_id, `Session ${Math.ceil(i/4)}`, '2024-03-01', i % 10 === 0 ? 'absent' : 'present'
    );
    db.prepare('INSERT INTO material_access (student_id, material_id, watch_time, completion_percent) VALUES (?, ?, ?, ?)').run(
      student_id, (i % 20) + 1, Math.floor(Math.random() * 1000), Math.floor(Math.random() * 100)
    );
  }

  // Assignments
  db.prepare('INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)').run(1, 'Build a Todo App', 'Use React state and props', '2024-03-15');
  db.prepare('INSERT INTO assignment_submissions (assignment_id, student_id, score) VALUES (?, ?, ?)').run(1, 8, 95);
  db.prepare('INSERT INTO assignment_submissions (assignment_id, student_id, score) VALUES (?, ?, ?)').run(1, 9, 88);

  // Login Activity
  db.prepare('INSERT INTO login_activity (user_id, ip_address) VALUES (?, ?)').run(8, '192.168.1.1');
  db.prepare('INSERT INTO login_activity (user_id, ip_address) VALUES (?, ?)').run(9, '192.168.1.2');

  // Certifications
  db.prepare('INSERT INTO certifications (student_id, course_id, certificate_id) VALUES (?, ?, ?)').run(8, 1, 'CERT-12345');
  db.prepare('INSERT INTO certifications (student_id, course_id, certificate_id) VALUES (?, ?, ?)').run(10, 1, 'CERT-67890');

  // Mock Interviews
  db.prepare('INSERT INTO mock_interviews (student_id, interview_date, score, feedback) VALUES (?, ?, ?, ?)').run(8, '2024-02-10', 85, 'Good technical knowledge');
  db.prepare('INSERT INTO mock_interviews (student_id, interview_date, score, feedback) VALUES (?, ?, ?, ?)').run(11, '2024-02-12', 95, 'Excellent communication');

  // Assessment Results
  db.prepare('INSERT INTO assessment_results (student_id, assessment_id, score, total_marks, passed) VALUES (?, ?, ?, ?, ?)').run(8, 1, 85, 100, 1);
  db.prepare('INSERT INTO assessment_results (student_id, assessment_id, score, total_marks, passed) VALUES (?, ?, ?, ?, ?)').run(12, 1, 98, 100, 1);
  db.prepare('INSERT INTO assessment_results (student_id, assessment_id, score, total_marks, passed) VALUES (?, ?, ?, ?, ?)').run(9, 1, 45, 100, 0);
};

seedData();

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Basic CRUD for Dashboard Stats
  app.get('/api/stats/admin', (req, res) => {
    const vendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
    const colleges = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count;
    const trainers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('trainer').count;
    const students = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student').count;
    
    const studentPerformance = db.prepare(`
      SELECT u.name, p.cgpa, a.programming 
      FROM users u
      JOIN student_profiles p ON u.id = p.student_id
      JOIN aptitude_scores a ON u.id = a.student_id
      LIMIT 10
    `).all();

    const placementStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END) as placed,
        SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM placement_status
    `).get();

    res.json({ vendors, colleges, trainers, students, studentPerformance, placementStats });
  });

  app.get('/api/vendors', (req, res) => {
    const vendors = db.prepare('SELECT * FROM vendors').all();
    res.json(vendors);
  });

  app.post('/api/vendors', (req, res) => {
    const { name, contact_person, contact_email, contact_phone } = req.body;
    const result = db.prepare('INSERT INTO vendors (name, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?)').run(name, contact_person, contact_email, contact_phone);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/vendors/:id', (req, res) => {
    const { name, status, contact_person, contact_email, contact_phone } = req.body;
    db.prepare('UPDATE vendors SET name = ?, status = ?, contact_person = ?, contact_email = ?, contact_phone = ? WHERE id = ?').run(name, status, contact_person, contact_email, contact_phone, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/vendors/:id', (req, res) => {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/colleges', (req, res) => {
    const colleges = db.prepare('SELECT * FROM colleges').all();
    res.json(colleges);
  });

  app.post('/api/colleges', (req, res) => {
    const { name, spoc_name, spoc_email, address, city, state } = req.body;
    const result = db.prepare('INSERT INTO colleges (name, spoc_name, spoc_email, address, city, state) VALUES (?, ?, ?, ?, ?, ?)').run(name, spoc_name, spoc_email, address, city, state);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/colleges/:id', (req, res) => {
    const { name, spoc_name, spoc_email, address, city, state } = req.body;
    db.prepare('UPDATE colleges SET name = ?, spoc_name = ?, spoc_email = ?, address = ?, city = ?, state = ? WHERE id = ?').run(name, spoc_name, spoc_email, address, city, state, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/colleges/:id', (req, res) => {
    db.prepare('DELETE FROM colleges WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/courses', (req, res) => {
    const courses = db.prepare(`
      SELECT c.*, u.name as trainer_name, v.name as vendor_name 
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      LEFT JOIN vendors v ON c.vendor_id = v.id
    `).all();
    res.json(courses);
  });

  app.post('/api/courses', (req, res) => {
    const { name, description, duration, trainer_id, vendor_id, category, level } = req.body;
    const result = db.prepare('INSERT INTO courses (name, description, duration, trainer_id, vendor_id, category, level) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, description, duration, trainer_id, vendor_id, category, level);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/courses/:id', (req, res) => {
    const { name, description, duration, trainer_id, vendor_id, category, level } = req.body;
    db.prepare('UPDATE courses SET name = ?, description = ?, duration = ?, trainer_id = ?, vendor_id = ?, category = ?, level = ? WHERE id = ?').run(name, description, duration, trainer_id, vendor_id, category, level, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/courses/:id', (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/courses/:id/materials', (req, res) => {
    const materials = db.prepare('SELECT * FROM materials WHERE course_id = ? ORDER BY sort_order').all(req.params.id);
    res.json(materials);
  });

  app.post('/api/courses/:id/materials', (req, res) => {
    const { type, title, content, sort_order } = req.body;
    const result = db.prepare('INSERT INTO materials (course_id, type, title, content, sort_order) VALUES (?, ?, ?, ?, ?)').run(req.params.id, type, title, content, sort_order);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/courses/:id/assessments', (req, res) => {
    const assessments = db.prepare('SELECT * FROM assessments WHERE course_id = ?').all(req.params.id);
    res.json(assessments);
  });

  app.post('/api/courses/:id/assessments', (req, res) => {
    const { title, duration, passing_marks } = req.body;
    const result = db.prepare('INSERT INTO assessments (course_id, title, duration, passing_marks) VALUES (?, ?, ?, ?)').run(req.params.id, title, duration, passing_marks);
    res.json({ id: result.lastInsertRowid });
  });

  // User Management
  app.get('/api/users/:id', (req, res) => {
  const user = db.prepare(`
    SELECT u.*, sp.*, c.name as college_name 
    FROM users u 
    LEFT JOIN student_profiles sp ON u.id = sp.user_id 
    LEFT JOIN colleges c ON u.college_id = c.id
    WHERE u.id = ?
  `).get(req.params.id);
  res.json(user);
});

app.get('/api/users', (req, res) => {
    const { role } = req.query;
    let query = 'SELECT * FROM users';
    let params: any[] = [];
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    const users = db.prepare(query).all(...params);
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { email, password, role, name, college_id, vendor_id } = req.body;
    const result = db.prepare('INSERT INTO users (email, password, role, name, college_id, vendor_id) VALUES (?, ?, ?, ?, ?, ?)').run(email, password, role, name, college_id || null, vendor_id || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Reports Endpoints
  app.get('/api/student/:id/full-report', (req, res) => {
    const studentId = req.params.id;
    const profile = db.prepare(`
      SELECT u.name, u.email, c.name as college, p.*, ps.status as placement_status, ps.company_name, ps.package
      FROM users u 
      LEFT JOIN colleges c ON u.college_id = c.id 
      LEFT JOIN student_profiles p ON u.id = p.student_id 
      LEFT JOIN placement_status ps ON u.id = ps.student_id 
      WHERE u.id = ? AND u.role = 'student'
    `).get(studentId);

    const aptitude = db.prepare(`SELECT * FROM aptitude_scores WHERE student_id = ?`).get(studentId);
    
    const courses = db.prepare(`
      SELECT crs.name, e.progress, e.enrolled_at 
      FROM enrollments e 
      JOIN courses crs ON e.course_id = crs.id 
      WHERE e.student_id = ?
    `).all(studentId);

    const assessments = db.prepare(`
      SELECT a.title, ar.score, ar.total_marks, ar.passed 
      FROM assessment_results ar 
      JOIN assessments a ON ar.assessment_id = a.id 
      WHERE ar.student_id = ?
    `).all(studentId);

    res.json({ profile, aptitude, courses, assessments });
  });

  app.get('/api/reports/:type', (req, res) => {
    const { type } = req.params;
    let query = '';
    
    switch (type) {
      case 'student-profile':
        query = `SELECT u.name, u.email, c.name as college, p.*, ps.status as placement_status 
                 FROM users u 
                 LEFT JOIN colleges c ON u.college_id = c.id 
                 LEFT JOIN student_profiles p ON u.id = p.student_id 
                 LEFT JOIN placement_status ps ON u.id = ps.student_id 
                 WHERE u.role = 'student'`;
        break;
      case 'enrollment':
        query = `SELECT u.name as student_name, crs.name as course_name, e.enrolled_at, e.batch 
                 FROM enrollments e 
                 JOIN users u ON e.student_id = u.id 
                 JOIN courses crs ON e.course_id = crs.id`;
        break;
      case 'course-progress':
        query = `SELECT crs.name as course_name, 10 as total_modules, 5 as completed_modules, e.progress 
                 FROM enrollments e 
                 JOIN courses crs ON e.course_id = crs.id`;
        break;
      case 'material-access':
        query = `SELECT u.name as student_name, m.title as material_name, m.type, ma.accessed_at 
                 FROM material_access ma 
                 JOIN users u ON ma.student_id = u.id 
                 JOIN materials m ON ma.material_id = m.id`;
        break;
      case 'video-watch-time':
        query = `SELECT m.title as video_name, 600 as total_duration, ma.watch_time, ma.completion_percent 
                 FROM material_access ma 
                 JOIN materials m ON ma.material_id = m.id 
                 WHERE m.type = 'video'`;
        break;
      case 'assignment-submission':
        query = `SELECT a.title as assignment_name, u.name as student_name, 
                 CASE WHEN asub.id IS NOT NULL THEN 'Submitted' ELSE 'Not Submitted' END as status, asub.score 
                 FROM assignments a 
                 CROSS JOIN users u 
                 LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND u.id = asub.student_id 
                 WHERE u.role = 'student'`;
        break;
      case 'assessment-attempt':
        query = `SELECT a.title as assessment_name, u.name as student_name, ar.completed_at as attempt_date, ar.attempt_number 
                 FROM assessment_results ar 
                 JOIN assessments a ON ar.assessment_id = a.id 
                 JOIN users u ON ar.student_id = u.id`;
        break;
      case 'assessment-score':
        query = `SELECT a.title as assessment_name, ar.total_marks, ar.score as obtained_marks, 
                 CASE WHEN ar.passed THEN 'Pass' ELSE 'Fail' END as result 
                 FROM assessment_results ar 
                 JOIN assessments a ON ar.assessment_id = a.id`;
        break;
      case 'attendance':
        query = `SELECT crs.name as course_name, u.name as student_name, att.session_name, att.date, att.status 
                 FROM attendance att 
                 JOIN courses crs ON att.course_id = crs.id 
                 JOIN users u ON att.student_id = u.id`;
        break;
      case 'aptitude-test':
        query = `SELECT u.name, ascore.logical, ascore.quant, ascore.verbal 
                 FROM aptitude_scores ascore 
                 JOIN users u ON ascore.student_id = u.id`;
        break;
      case 'technical-skill':
        query = `SELECT u.name, ascore.programming, ascore.coding_challenges 
                 FROM aptitude_scores ascore 
                 JOIN users u ON ascore.student_id = u.id`;
        break;
      case 'placement-readiness':
        query = `SELECT u.id as student_id, u.name, ascore.programming as technical_score, ascore.logical as aptitude_score, ascore.communication as communication_score 
                 FROM aptitude_scores ascore 
                 JOIN users u ON ascore.student_id = u.id`;
        break;
      case 'placement-status':
        query = `SELECT u.name, ps.company_name, ps.interview_date, ps.status 
                 FROM placement_status ps 
                 JOIN users u ON ps.student_id = u.id`;
        break;
      case 'offer-letter':
        query = `SELECT u.name, ps.company_name, ps.package 
                 FROM placement_status ps 
                 JOIN users u ON ps.student_id = u.id 
                 WHERE ps.offer_letter_status = 'received'`;
        break;
      case 'leaderboard':
        query = `SELECT RANK() OVER (ORDER BY (ascore.programming + ascore.logical + ascore.quant) DESC) as rank, 
                 u.name as student_name, (ascore.programming + ascore.logical + ascore.quant) as score 
                 FROM aptitude_scores ascore 
                 JOIN users u ON ascore.student_id = u.id`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    try {
      const data = db.prepare(query).all();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student Profile Update
  app.put('/api/students/:id/profile', (req, res) => {
    const { gender, dob, phone, address, department, batch, tenth_percent, twelfth_percent, degree, cgpa, backlogs } = req.body;
    db.prepare(`UPDATE student_profiles SET 
      gender = ?, dob = ?, phone = ?, address = ?, department = ?, batch = ?, 
      tenth_percent = ?, twelfth_percent = ?, degree = ?, cgpa = ?, backlogs = ? 
      WHERE student_id = ?`).run(gender, dob, phone, address, department, batch, tenth_percent, twelfth_percent, degree, cgpa, backlogs, req.params.id);
    res.json({ success: true });
  });

  // Questions Management
  app.get('/api/questions', (req, res) => {
    res.json(db.prepare('SELECT * FROM questions').all());
  });

  app.post('/api/questions', (req, res) => {
    const { topic, difficulty, type, question, options, correct_answer } = req.body;
    const result = db.prepare('INSERT INTO questions (topic, difficulty, type, question, options, correct_answer) VALUES (?, ?, ?, ?, ?, ?)').run(topic, difficulty, type, question, JSON.stringify(options), correct_answer);
    res.json({ id: result.lastInsertRowid });
  });

  app.post('/api/assessments/:id/questions', (req, res) => {
    const { question_id } = req.body;
    db.prepare('INSERT INTO assessment_questions (assessment_id, question_id) VALUES (?, ?)').run(req.params.id, question_id);
    res.json({ success: true });
  });

  app.get('/api/students/report', (req, res) => {
    const report = db.prepare(`
      SELECT 
        u.id, u.name, u.email, 
        p.department, p.batch, p.cgpa,
        a.logical, a.quant, a.programming,
        ps.company_name, ps.package, ps.status as placement_status
      FROM users u
      LEFT JOIN student_profiles p ON u.id = p.student_id
      LEFT JOIN aptitude_scores a ON u.id = a.student_id
      LEFT JOIN placement_status ps ON u.id = ps.student_id
      WHERE u.role = 'student'
    `).all();
    res.json(report);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
