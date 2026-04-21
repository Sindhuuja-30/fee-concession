const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Concession = require('./models/Concession');
const Notification = require('./models/Notification');
const DecisionHistory = require('./models/DecisionHistory');
const Scheme = require('./models/Scheme');

// Utilities and Middleware
const { calculateEligibilityScore } = require('./utils/eligibilityScoring');
const { evaluateSchemeEligibility } = require('./utils/schemeEligibility');
const { checkRole, authenticateUser } = require('./middleware/auth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 1. Logger (MUST BE FIRST)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers Content-Type:', req.headers['content-type']);
  next();
});

// 2. CORS & Parser
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      console.log('Raw Body:', buf.toString(encoding || 'utf8'));
    }
  }
})); // Handles application/json
app.use(express.urlencoded({ extended: true })); // Handles application/x-www-form-urlencoded

// 18: Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Created uploads directory');
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename to avoid weird characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

// Serve static files - REMOVED FOR SECURITY
// app.use('/uploads', express.static('uploads'));

// Secure File Preview Route
// Access: Admin OR Owner (Student)
app.get('/api/file-preview/:filename', authenticateUser, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Authorization Check
    const user = req.user;
    let isAuthorized = false;

    if (user.role === 'admin') {
      isAuthorized = true;
    } else if (user.role === 'student') {
      // Check if file belongs to this student
      // 1. Check User Profile documents
      if (user.documents && Object.values(user.documents).includes(filename)) {
        isAuthorized = true;
      } else {
        // 2. Check submitted Concessions
        const concessions = await Concession.find({ studentId: user._id });
        for (const app of concessions) {
          if (app.documents && app.documents.includes(filename)) {
            isAuthorized = true;
            break;
          }
        }
      }
    }

    if (!isAuthorized) {
      console.warn(`[FILE ACCESS DENIED] User: ${user._id} (${user.role}), File: ${filename}`);
      return res.status(403).json({ error: 'Unauthorized access to this file' });
    }

    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (err) {
    console.error('File Preview Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to create notification
const createNotification = async (recipientId, message, type = 'info', relatedId = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.warn(`Invalid recipientId for notification: ${recipientId}`);
      return;
    }
    const notif = new Notification({ recipientId, message, type, relatedId });
    await notif.save();
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// --- Password Validation Helper ---
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return "Password must be at least 8 characters long.";
  if (!hasUpperCase) return "Password must contain at least one uppercase letter.";
  if (!hasLowerCase) return "Password must contain at least one lowercase letter.";
  if (!hasNumber) return "Password must contain at least one numeric digit.";
  if (!hasSpecialChar) return "Password must contain at least one special character.";
  return null;
};

// --- Database Connection ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        // Do not exit process, let it try to reconnect or handle via middleware
    }
};

connectDB();

// --- API Routes ---

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    // Check Database Connectivity
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            error: 'Database connection issue. The MongoDB service may not be running. Please check your backend logs.',
            details: 'Connection state: ' + mongoose.connection.readyState
        });
    }

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Strict Password Validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('[REGISTER_ERROR]:', err);
    res.status(500).json({
      error: 'Registration failed due to server error',
      details: err.message
    });
  }
});


// 2. Login
app.post('/api/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    // Task: Log incoming request body
    console.log('[LOGIN_DEBUG] Incoming Request Body:', { email, password: password ? '********' : 'MISSING' });

    if (!email || !password) {
      console.warn('[LOGIN_FAILED] Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Task: Ensure database connection is active
    if (mongoose.connection.readyState !== 1) {
      console.error('[DATABASE_ERROR] MongoDB is not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection issue. Please try again later.' });
    }

    // Task: Log database query result
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[LOGIN_FAILED] No user found with email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[LOGIN_DEBUG] Database Query Result: User found', {
      id: user._id,
      name: user.name,
      role: user.role
    });

    // Task: Log authentication result
    // Note: Plain text comparison as requested by user in model schema
    if (user.password !== password) {
      console.warn(`[LOGIN_FAILED] Password mismatch for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[LOGIN_SUCCESS] User ${email} authenticated successfully.`);

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    // Task: Proper backend error handling with logging
    console.error('[LOGIN_ERROR] unexpected server error:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Health Check API
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    status: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});


// 3. Change Password
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Update password
    user.password = newPassword;
    await user.save();


    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Student: Get Profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Return all user data
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Seed Schemes if not present ────────────────────────────────────────────
const SCHEME_NAMES = ['Government Scholarship', 'Minority Scholarship', 'Sports Quota', 'Merit Scholarship'];
async function seedSchemes() {
  for (const name of SCHEME_NAMES) {
    const exists = await Scheme.findOne({ name });
    if (!exists) {
      await Scheme.create({ name });
      console.log(`[SEED] Created scheme: ${name}`);
    }
  }
}
// Run seed after DB connects (safe to call multiple times)
mongoose.connection.once('open', () => { seedSchemes().catch(console.error); });

// 3. Student: Apply
app.post('/api/apply', (req, res, next) => {
  // Build dynamic sports cert fields (up to 10)
  const sportsCertFields = Array.from({ length: 10 }, (_, i) => ({ name: `sportsCert_${i}`, maxCount: 1 }));

  upload.fields([
    { name: 'incomeCert', maxCount: 1 },
    { name: 'bonafideCert', maxCount: 1 },
    { name: 'feeReceipt', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'religionProof', maxCount: 1 },
    { name: 'otherDoc', maxCount: 1 },
    ...sportsCertFields
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      return res.status(500).json({ error: `Upload Error: ${err.message}` });
    } else if (err) {
      console.error('Unknown Upload Error:', err);
      return res.status(500).json({ error: `Unknown Error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    const {
      studentId, studentName, registerNo, department, year,
      income, occupation, dependents, category, reason, amount, concessionType,
      parentName, residentialArea, semesterFee, prevSemResult, scholarship,
      course, institution, email, mobile,
      cgpa, semester, academicYear,
      specialConditions,
      parentContact, hostelStatus,
      // ── New family income fields ──
      familyIncomeAmount,
      // ── New scheme fields ──
      scheme, religion, marksPercentage,
      sportsCertificatesData    // JSON string: [{level:'Zone'}, {level:'State'}, ...]
    } = req.body;

    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    // 2. Extract Uploaded Files
    const incomeCertFile = req.files?.incomeCert?.[0]?.filename || null;
    const bonafideCertFile = req.files?.bonafideCert?.[0]?.filename || null;
    const feeReceiptFile = req.files?.feeReceipt?.[0]?.filename || null;
    const marksheetFile = req.files?.marksheet?.[0]?.filename || null;
    const religionProofFile = req.files?.religionProof?.[0]?.filename || null;
    const otherDocFile = req.files?.otherDoc?.[0]?.filename || null;

    // Extract sports certificate files (sportsCert_0, sportsCert_1, ...)
    const sportsCertFiles = [];
    for (let i = 0; i < 10; i++) {
      const fieldName = `sportsCert_${i}`;
      if (req.files?.[fieldName]?.[0]) {
        sportsCertFiles.push({ index: i, filename: req.files[fieldName][0].filename });
      }
    }

    // Parse sportsCertificatesData (levels metadata from frontend)
    let parsedSportsCerts = [];
    if (sportsCertificatesData) {
      try {
        parsedSportsCerts = typeof sportsCertificatesData === 'string'
          ? JSON.parse(sportsCertificatesData)
          : sportsCertificatesData;
        // Attach uploaded filenames to each cert entry
        parsedSportsCerts = parsedSportsCerts.map((cert, idx) => ({
          level: cert.level,
          filename: sportsCertFiles.find(f => f.index === idx)?.filename || ''
        }));
      } catch (e) {
        console.error('Error parsing sportsCertificatesData:', e);
        parsedSportsCerts = [];
      }
    }

    // Parse specialConditions
    let parsedConditions = [];
    if (specialConditions) {
      try {
        parsedConditions = typeof specialConditions === 'string' ? JSON.parse(specialConditions) : specialConditions;
      } catch (e) {
        parsedConditions = [specialConditions];
      }
    }

    // 3. Find User & Handle Profile Updates
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profileFields = {
      registerNo, department, year, income, occupation, parentName,
      residentialArea, semesterFee, prevSemResult, scholarship,
      course, institution, mobile, dependents, category,
      parentContact, hostelStatus
    };
    Object.assign(user, profileFields);

    if (!user.documents) user.documents = {};
    if (incomeCertFile) user.documents.incomeCert = incomeCertFile;
    if (bonafideCertFile) user.documents.bonafideCert = bonafideCertFile;
    if (feeReceiptFile) user.documents.feeReceipt = feeReceiptFile;
    if (marksheetFile) user.documents.marksheet = marksheetFile;
    if (otherDocFile) user.documents.otherDoc = otherDocFile;

    await user.save();

    // 4. Determine Final Filenames
    const incomeCert = incomeCertFile || user.documents.incomeCert || '';
    const bonafideCert = bonafideCertFile || user.documents.bonafideCert || '';
    const feeReceipt = feeReceiptFile || user.documents.feeReceipt || '';
    const marksheet = marksheetFile || user.documents.marksheet || '';
    const religionProof = religionProofFile || '';
    const otherDoc = otherDocFile || user.documents.otherDoc || '';

    // 5. Legacy Eligibility Score
    const eligibility = calculateEligibilityScore({
      income, residentialArea, category, prevSemResult, scholarship,
      cgpa, specialConditions: parsedConditions
    });

    // 6. ── Scheme-Based Eligibility ──────────────────────────────────────────
    let schemeResult = { eligible: null, concessionPercentage: 0, sportsPoints: 0, reason: '' };

    // Ensure familyIncomeAmount is a number
    const incomeValue = Number(familyIncomeAmount) || 0;

    if (scheme) {
      console.log(`[ELIGIBILITY_DEBUG] Scheme: ${scheme}, Income: ${incomeValue} (type: ${typeof incomeValue}), Cert: ${!!incomeCert}`);
      schemeResult = evaluateSchemeEligibility(scheme, {
        income: incomeValue || income, // Use numeric income if available, fallback to str
        hasIncomeCert: !!incomeCert,
        religion,
        marksPercentage: parseFloat(marksPercentage) || 0,
        sportsCertificates: parsedSportsCerts
      });
      console.log(`[SCHEME] Scheme: ${scheme}, Eligible: ${schemeResult.eligible}, Concession: ${schemeResult.concessionPercentage}%, Points: ${schemeResult.sportsPoints}`);
    }

    // 7. ── Income-Based Point System ─────────────────────────────────────────
    let incomePoints = 0;

    if (incomeValue > 500000) {
      incomePoints = 10;
    } else if (incomeValue >= 400000 && incomeValue <= 500000) {
      incomePoints = 20;
    } else if (incomeValue >= 300000 && incomeValue < 400000) {
      incomePoints = 30;
    } else if (incomeValue >= 200000 && incomeValue < 300000) {
      incomePoints = 40;
    } else if (incomeValue >= 100000 && incomeValue < 200000) {
      incomePoints = 50;
    } else if (incomeValue > 0) {
      incomePoints = 50;
    }

    // ── Total Points & Recommendation Logic ──────────────────────────────────
    let adminRecommendation = 'No Recommendation Generated';
    const sportsPoints = schemeResult.sportsPoints || 0;
    const totalPoints = incomePoints + sportsPoints;

    // Saran's case (15 points) and range-based evaluation
    if (scheme === 'Sports Quota') {
      if (sportsPoints >= 20) adminRecommendation = 'Strongly Recommended'; // International
      else if (sportsPoints >= 15) adminRecommendation = 'Recommended';       // National (Saran)
      else if (sportsPoints >= 10) adminRecommendation = 'Consider Approval'; // State
      else if (sportsPoints >= 5) adminRecommendation = 'Consider Approval'; // District
      else if (sportsPoints >= 1) adminRecommendation = 'Low Priority';      // Zone
    } else {
      // General Logic based on Total Points
      if (totalPoints >= 40) adminRecommendation = 'Strongly Recommended';
      else if (totalPoints >= 30) adminRecommendation = 'Recommended';
      else if (totalPoints >= 20) adminRecommendation = 'Consider Approval';
      else if (totalPoints >= 10) adminRecommendation = 'Low Priority';
      else adminRecommendation = 'Low Priority'; // Default fallback instead of N/A
    }


    // 8. Create Concession
    const concession = new Concession({
      studentId, studentName, registerNo, department, year,
      income, occupation, dependents, category, reason, amount, concessionType,
      parentName, residentialArea, semesterFee, prevSemResult, scholarship,
      course, institution, email, mobile,
      cgpa, semester, academicYear,
      specialConditions: parsedConditions,
      parentContact: parentContact || '',
      hostelStatus: hostelStatus || '',

      incomeCert, bonafideCert, feeReceipt, marksheet, religionProof, otherDoc,
      documents: [
        incomeCert, bonafideCert, feeReceipt, marksheet, religionProof, otherDoc,
        ...sportsCertFiles.map(f => f.filename)
      ].filter(Boolean),

      scheme: scheme || '',
      religion: religion || '',
      marksPercentage: marksPercentage ? parseFloat(marksPercentage) : null,
      sportsCertificates: parsedSportsCerts,
      sportsPoints: schemeResult.sportsPoints,
      concessionPercentage: schemeResult.concessionPercentage,
      schemeEligible: schemeResult.eligible,
      schemeReason: schemeResult.reason,

      // New Income Points Fields
      familyIncomeAmount: incomeValue,
      incomePoints,
      adminRecommendation,

      eligibilityScore: eligibility.score,
      recommendedConcessionRate: eligibility.recommendedRate,
      priorityLevel: eligibility.priorityLevel
    });

    await concession.save();

    // 8. Increment studentsApplied for scheme
    if (scheme) {
      await Scheme.findOneAndUpdate(
        { name: scheme },
        { $inc: { studentsApplied: 1 } },
        { upsert: true, new: true }
      );
      console.log(`[SCHEME] Incremented studentsApplied for: ${scheme}`);
    }


    // 10. Notify Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        `New ${scheme || 'fee concession'} application from ${studentName} — ${schemeResult.concessionPercentage}% recommended`,
        'info',
        concession._id
      );
    }

    // 11. Success Response
    res.status(201).json({
      message: 'Application submitted successfully',
      scheme,
      schemeEligible: schemeResult.eligible,
      concessionPercentage: schemeResult.concessionPercentage,
      sportsPoints: schemeResult.sportsPoints,
      schemeReason: schemeResult.reason,
      eligibilityScore: eligibility.score,
      priorityLevel: eligibility.priorityLevel
    });

  } catch (err) {
    console.error('Database/Server Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Student: View My Applications
app.get('/api/student/:id', async (req, res) => {
  try {
    const applications = await Concession.find({ studentId: req.params.id });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Admin: View All Applications
app.get('/api/all', async (req, res) => {
  try {
    const applications = await Concession.find().populate('studentId', 'name email');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin: Update Status & Approve/Reject
app.post('/api/status', async (req, res) => {
  try {
    const { id, status, finalApprovedRate, rejectionReason, adminId } = req.body;

    console.log(`[STATUS_UPDATE] AppID: ${id}, Status: ${status}, AdminID: ${adminId}`);

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required.' });
    if (!id) return res.status(400).json({ error: 'Application ID (id) is required.' });

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      console.warn(`[UNAUTHORIZED STATUS UPDATE] AdminID ${adminId} not found or not admin.`);
      return res.status(403).json({ error: 'Unauthorized: Admin access required.' });
    }

    const updateData = { status };

    if (status === 'Approved') {
      if (finalApprovedRate === undefined || finalApprovedRate === null) {
        return res.status(400).json({ error: 'Final approved rate is required for approval.' });
      }
      updateData.finalApprovedRate = finalApprovedRate;
      updateData.rejectionReason = null;
      updateData.approvedBy = admin.name;
      updateData.approvalDate = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason || 'No reason provided';
      updateData.finalApprovedRate = null;
    }

    const application = await Concession.findByIdAndUpdate(id, updateData, { new: true });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // ── Increment studentsApproved for the scheme ────────────────────────────
    if (status === 'Approved' && application.scheme) {
      await Scheme.findOneAndUpdate(
        { name: application.scheme },
        { $inc: { studentsApproved: 1 } },
        { upsert: true, new: true }
      );
      console.log(`[SCHEME] Incremented studentsApproved for: ${application.scheme}`);
    }

    const message = status === 'Approved'
      ? `Your application has been APPROVED! Concession Granted: ${finalApprovedRate}%`
      : `Your application has been REJECTED. Reason: ${updateData.rejectionReason}`;

    await Notification.create({
      recipientId: application.studentId,
      message,
      type: status === 'Approved' ? 'success' : 'error'
    });

    // ── Log to Decision History ─────────────────────────────────────────────
    await DecisionHistory.create({
      studentName: application.studentName,
      registerNo: application.registerNo,
      schemeType: application.scheme || 'N/A',
      amount: application.amount,
      decision: status,
      adminName: admin.name,
      adminRole: admin.role
    });

    console.log(`[DECISION_HISTORY] Logged ${status} for ${application.studentName}`);

    res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
  } catch (err) {
    console.error('[STATUS UPDATE ERROR]', err);
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

// GET /api/decisions — Approval/Rejection History
app.get('/api/decisions', async (req, res) => {
  try {
    const decisions = await DecisionHistory.find().sort({ timestamp: -1 });
    res.json(decisions);
  } catch (err) {
    console.error('[DECISIONS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schemes — Scheme Utilization Data
app.get('/api/schemes', async (req, res) => {
  try {
    const schemes = await Scheme.find();
    const result = schemes.map(s => ({
      name: s.name,
      studentsApplied: s.studentsApplied,
      studentsApproved: s.studentsApproved,
      totalEligibleStudents: s.totalEligibleStudents,
      utilizationPercentage: s.utilizationPercentage
    }));
    res.json(result);
  } catch (err) {
    console.error('[SCHEMES ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Admin: Delete Application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID required' });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const application = await Concession.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.documents && application.documents.length > 0) {
      application.documents.forEach(filename => {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filename}`);
          } catch (fileErr) {
            console.error(`Failed to delete file ${filename}:`, fileErr);
          }
        }
      });
    }


    await Concession.findByIdAndDelete(id);
    console.log(`Application ${id} deleted by admin ${adminId}`);

    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Notifications: Get User Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    console.log(`[NOTIFICATION FETCH] User ID: ${req.params.userId}`);

    const notifications = await Notification.find({
      recipientId: req.params.userId,
      $or: [
        { isRead: false },
        { isRead: { $exists: false } },
        { isRead: null }
      ]
    }).sort({ date: -1 });

    console.log(`[NOTIFICATION FETCH] Found ${notifications.length} unread notification(s)`);
    res.json(notifications);
  } catch (err) {
    console.error('[NOTIFICATION FETCH ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Notifications: Mark as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    console.log(`[MARK AS READ] Notification ID: ${req.params.id}`);

    const result = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (result) {
      console.log(`[MARK AS READ] Success - isRead is now: ${result.isRead}`);
    } else {
      console.log(`[MARK AS READ] Notification not found`);
    }

    res.json({ success: true, notification: result });
  } catch (err) {
    console.error('[MARK AS READ ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. CLEANUP
app.post('/api/notifications/cleanup/:userId', async (req, res) => {
  try {
    console.log(`[CLEANUP] Marking ALL notifications as read for user: ${req.params.userId}`);

    const result = await Notification.updateMany(
      { recipientId: req.params.userId },
      { $set: { isRead: true } }
    );

    console.log(`[CLEANUP] Updated ${result.modifiedCount} notification(s)`);
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (err) {
    console.error('[CLEANUP ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. DEBUG
app.get('/api/notifications/debug/:userId', async (req, res) => {
  try {
    const all = await Notification.find({ recipientId: req.params.userId }).sort({ date: -1 });
    const unread = all.filter(n => !n.isRead);

    console.log(`[DEBUG] User ${req.params.userId}: Total=${all.length}, Unread=${unread.length}`);

    res.json({
      total: all.length,
      unread: unread.length,
      notifications: all.map(n => ({
        id: n._id,
        message: n.message,
        isRead: n.isRead,
        date: n.date
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==== ANALYTICS ENDPOINTS (Admin Only) ====

// 10. Analytics: Summary Stats
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const total = await Concession.countDocuments();
    const approved = await Concession.countDocuments({ status: 'Approved' });
    const rejected = await Concession.countDocuments({ status: 'Rejected' });
    const pending = await Concession.countDocuments({ status: 'Pending' });

    const approvedApplications = await Concession.find({ status: 'Approved' });
    const totalConcessionAmount = approvedApplications.reduce((sum, app) => sum + (app.amount || 0), 0);

    res.json({
      total,
      approved,
      rejected,
      pending,
      totalConcessionAmount
    });
  } catch (err) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Analytics: Department-wise Application Count
app.get('/api/analytics/departments', async (req, res) => {
  try {
    const departments = await Concession.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(departments);
  } catch (err) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 12. Analytics: Monthly Application Trend
app.get('/api/analytics/monthly-trend', async (req, res) => {
  try {
    const monthlyData = await Concession.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12 // Last 12 months
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = monthlyData.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      applications: item.count,
      count: item.count,
      approved: item.approved,
      rejected: item.rejected,
      pending: item.pending
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 13. Analytics: Daily Application Activity (Last 30 Days)
app.get('/api/analytics/daily-activity', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyData = await Concession.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const formatted = dailyData.map(item => ({
      date: `${item._id.day}/${item._id.month}`,
      count: item.count
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 14. Analytics: Fee Concession Trend (By Month)
app.get('/api/analytics/fee-trend', async (req, res) => {
  try {
    const feeData = await Concession.aggregate([
      {
        $match: { status: 'Approved' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = feeData.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      amount: item.totalAmount
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve Static Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API route not found on this server' });
    } else {
      res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    }
  });
} else {
  // 404 Handler for API routes (Development)
  app.use((req, res, next) => {
    console.log(`!!! 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API route not found on this server' });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
