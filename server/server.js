const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Concession = require('./models/Concession');
const Notification = require('./models/Notification');

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
app.use(express.json()); // Handles application/json
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

// Serve static files
app.use('/uploads', express.static('uploads'));

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

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- API Routes ---

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
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
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Student: Get Profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Return all user data (excluding password ideally, but relying on mongoose default selection or just sending it all since it's an internal object for now, user schema has simple password)
    // Be safe:
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student: Apply
app.post('/api/apply', (req, res, next) => {
  // Use fields to map specific files to specific document types
  upload.fields([
    { name: 'incomeCert', maxCount: 1 },
    { name: 'bonafideCert', maxCount: 1 },
    { name: 'feeReceipt', maxCount: 1 },
    { name: 'otherDoc', maxCount: 1 }
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
    console.log('--- Apply Route Processing ---');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const {
      studentId, studentName, registerNo, department, year,
      income, occupation, dependents, category, reason, amount, concessionType,
      parentName, residentialArea, semesterFee, prevSemResult, scholarship,
      course, institution, email, mobile
    } = req.body;

    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    // 1. Find User to update profile
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Update Persisted Profile Fields
    // using || to keep existing if not provided? No, form sends empty strings if cleared.
    // user schema has defaults. We overwrite with latest form data.
    user.registerNo = registerNo;
    user.department = department;
    user.year = year;
    user.income = income;
    user.occupation = occupation;
    user.parentName = parentName;
    user.residentialArea = residentialArea;
    user.semesterFee = semesterFee;
    user.prevSemResult = prevSemResult;
    user.scholarship = scholarship;
    user.course = course;
    user.institution = institution;
    user.mobile = mobile;
    user.dependents = dependents;
    user.category = category;

    // 3. Handle Documents (Update User Profile & Prepare for Concession)
    // We update the user.documents with new filenames if uploaded.
    // If not uploaded, we keep the old one (which is already in user.documents).

    if (!user.documents) user.documents = {};

    const fileKeys = ['incomeCert', 'bonafideCert', 'feeReceipt', 'otherDoc'];
    const concessionDocs = [];

    fileKeys.forEach(key => {
      if (req.files && req.files[key]) {
        // New file uploaded
        const filename = req.files[key][0].filename;
        user.documents[key] = filename;
        concessionDocs.push(filename);
      } else if (user.documents[key]) {
        // No new file, use existing from profile
        concessionDocs.push(user.documents[key]);
      }
    });

    // Save Updated User Profile
    await user.save();

    // 4. Create Concession
    const concession = new Concession({
      studentId, studentName, registerNo, department, year,
      income, occupation, dependents, category, reason, amount, concessionType,
      parentName, residentialArea, semesterFee, prevSemResult, scholarship,
      course, institution, email, mobile,
      documents: concessionDocs // Array of all relevant filenames
    });

    await concession.save();

    // 5. Notify Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification(admin._id, `New application from ${studentName}`, 'info', concession._id);
    }

    res.json({ message: 'Application submitted and profile updated successfully' });

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

// 5. Admin: Update Status
app.post('/api/status', async (req, res) => {
  try {
    const { id, status } = req.body;
    const application = await Concession.findByIdAndUpdate(id, { status }, { new: true });

    // NOTIFY STUDENT
    if (application) {
      let message = `Your application has been ${status}.`;
      let type = status === 'Approved' ? 'success' : (status === 'Rejected' ? 'error' : 'info');
      await createNotification(application.studentId, message, type);
    }

    res.json({ message: `Application ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Notifications: Get User Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    console.log(`Fetching notifications for user: ${req.params.userId}`);
    const notifications = await Notification.find({ recipientId: req.params.userId }).sort({ date: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Notifications: Mark as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Handler for unmatched routes
app.use((req, res, next) => {
  console.log(`!!! 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
