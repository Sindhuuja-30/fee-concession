import { useState, useEffect } from 'react';
import API from '../api';
import Timeline from '../components/Timeline';
import NotificationBanner from '../components/NotificationBanner';

function StudentDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [applications, setApplications] = useState([]);

    // Notifications State
    const [notifications, setNotifications] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        // Auto-filled / Read-only
        studentName: user.name || '',
        email: user.email || '',
        course: '',
        institution: '',
        mobile: '',

        // Existing & New Fields
        registerNo: '',
        department: '',
        year: '',
        income: '',
        occupation: '',
        dependents: '',
        category: '',
        reason: '',
        amount: '',
        concessionType: 'Partial',

        // New Family & Academic Details
        parentName: '',
        residentialArea: '',
        semesterFee: '',
        prevSemResult: '',
        scholarship: ''
    });

    const [files, setFiles] = useState({
        incomeCert: null,
        bonafideCert: null,
        feeReceipt: null,
        otherDoc: null
    });

    // Declaration State
    const [declaration, setDeclaration] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Profile & Edit State
    const [isEditing, setIsEditing] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;

        const loadDashboardData = async () => {
            // 1. Fetch Profile
            try {
                const { data } = await API.get(`/user/${user.id}`);

                // If we got profile data (check a key field)
                if (data.registerNo || data.department) {
                    setFormData(prev => ({
                        ...prev,
                        registerNo: data.registerNo || '',
                        department: data.department || '',
                        year: data.year || '',
                        income: data.income || '',
                        occupation: data.occupation || '',
                        parentName: data.parentName || '',
                        residentialArea: data.residentialArea || 'Rural',
                        semesterFee: data.semesterFee || '',
                        prevSemResult: data.prevSemResult || 'Pass',
                        scholarship: data.scholarship || 'No',
                        dependents: data.dependents || '',
                        category: data.category || '',
                        mobile: data.mobile || '',
                    }));

                    // Set existing files metadata
                    if (data.documents) {
                        const mockFiles = {};
                        if (data.documents.incomeCert) mockFiles.incomeCert = { name: data.documents.incomeCert, existing: true };
                        if (data.documents.bonafideCert) mockFiles.bonafideCert = { name: data.documents.bonafideCert, existing: true };
                        if (data.documents.feeReceipt) mockFiles.feeReceipt = { name: data.documents.feeReceipt, existing: true };
                        if (data.documents.otherDoc) mockFiles.otherDoc = { name: data.documents.otherDoc, existing: true };
                        setFiles(prev => ({ ...prev, ...mockFiles }));
                    }

                    setIsEditing(false); // Data found, go to View Mode
                } else {
                    // No profile data found, enforce edit mode
                    setIsEditing(true);
                }
            } catch (err) {
                console.error("Profile Fetch Error:", err);
            } finally {
                setIsLoadingProfile(false);
            }

            // 2. Fetch Applications & Notifications
            fetchApplications();
            fetchNotifications();
        };

        loadDashboardData();

        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    // Auto-fill effect when applications are loaded
    useEffect(() => {
        if (applications.length > 0) {
            // Get most recent application to auto-fill details
            const lastApp = applications[0]; // Assuming API returns sorted or we pick first
            setFormData(prev => ({
                ...prev,
                course: lastApp.course || prev.course,
                institution: lastApp.institution || prev.institution,
                mobile: lastApp.mobile || prev.mobile,
                // Also auto-fill static details if they were empty
                department: prev.department || lastApp.department,
                registerNo: prev.registerNo || lastApp.registerNo,
                year: prev.year || lastApp.year
            }));
        }
    }, [applications]);

    const fetchApplications = async () => {
        if (!user || !user.id) return;
        try {
            const { data } = await API.get(`/student/${user.id}`);
            setApplications(data);
        } catch (err) {
            console.error("Fetch Applications Error:", err);
        }
    };

    const fetchNotifications = async () => {
        if (!user || !user.id) return;
        try {
            const { data } = await API.get(`/notifications/${user.id}`);
            setNotifications(data.filter(n => !n.isRead).slice(0, 3));
        } catch (err) {
            // Silently fail for notifications to avoid console spam, or log debug only
            console.warn('Notification fetch failed (possibly invalid ID):', err.response?.status);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSingleFileChange = (e, key) => {
        const file = e.target.files[0];
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleApply = async (e) => {
        e.preventDefault();

        if (!declaration) {
            alert("Please check the declaration box to proceed.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Use FormData for file upload
            const data = new FormData();
            data.append('studentId', user.id);
            // Ensure name/email are sent even if read-only
            data.append('studentName', formData.studentName);
            data.append('email', formData.email);

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'studentName' && key !== 'email') { // already appended above or managed
                    data.append(key, formData[key]);
                }
            });

            // Append specific files (only if new)
            if (files.incomeCert && !files.incomeCert.existing) data.append('incomeCert', files.incomeCert);
            if (files.bonafideCert && !files.bonafideCert.existing) data.append('bonafideCert', files.bonafideCert);
            if (files.feeReceipt && !files.feeReceipt.existing) data.append('feeReceipt', files.feeReceipt);
            if (files.otherDoc && !files.otherDoc.existing) data.append('otherDoc', files.otherDoc);

            // Debug: Log FormData keys and values (Browser console)
            console.log("--- Sending FormData ---");
            for (let [key, value] of data.entries()) {
                console.log(`${key}:`, value);
            }

            // AXIOS automatically sets Content-Type to multipart/form-data
            const response = await API.post('/apply', data);

            console.log("Submission Success:", response.data);
            alert('Application Submitted Successfully!');

            // Reset form partly (keep auto-filled)
            setFormData(prev => ({
                ...prev,
                income: '',
                reason: '',
                amount: '',
                // Reset others as needed, but keep static info
                semesterFee: '',
                // retain category etc if desired, or reset
            }));
            setFiles({ incomeCert: null, bonafideCert: null, feeReceipt: null, otherDoc: null });
            setDeclaration(false);

            fetchApplications();
        } catch (err) {
            console.error("Submission Error:", err);
            const errMsg = err.response?.data?.error || err.message || "Unknown error";
            alert(`Error submitting application: ${errMsg}`);
        } finally {
            setIsSubmitting(false); // ALWAYS release loading state
        }
    };

    const handleNotificationClose = async (id, action = 'close') => {
        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n._id !== id));

        if (action === 'read') {
            try {
                await API.put(`/notifications/${id}/read`);
            } catch (err) {
                console.error("Error marking notification as read:", err);
            }
        }
    };

    // Preview State
    const [previewData, setPreviewData] = useState(null);

    const handleLocalPreview = (file) => {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreviewData({
            url: objectUrl,
            name: file.name,
            type: file.type
        });
    };

    const closePreview = () => {
        if (previewData?.url) URL.revokeObjectURL(previewData.url);
        setPreviewData(null);
    };

    return (
        <div>
            <NotificationBanner notifications={notifications} onClose={handleNotificationClose} />

            {/* Preview Modal */}
            {previewData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1e1e1e', width: '90%', maxWidth: '1000px', height: '85vh',
                        borderRadius: '12px', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{
                            padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{previewData.name}</h3>
                            <button onClick={closePreview} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            {previewData.type.includes('image') ? (
                                <img src={previewData.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : previewData.type.includes('pdf') ? (
                                <iframe src={previewData.url} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                            ) : (
                                <div style={{ color: '#aaa' }}>No preview available for this file type.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <h2>Student Dashboard</h2>

            {/* Application Form */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Apply for Fee Concession</h3>
                    {!isLoadingProfile && (
                        <button
                            type="button"
                            className={`edit-btn ${isEditing ? 'active' : ''}`}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? '📝 Editing Mode' : '✏️ Edit Details'}
                        </button>
                    )}
                </div>
                <form onSubmit={handleApply}>
                    <div className="form-grid">

                        {/* 1. Auto-filled / Read Only Details */}
                        <div className="form-group">
                            <input type="text" value={formData.studentName} readOnly className="read-only-input" />
                            <label>Student Name</label>
                            <span className="input-icon">👤</span>
                        </div>
                        <div className="form-group">
                            <input type="text" value={formData.email} readOnly className="read-only-input" />
                            <label>Email ID</label>
                            <span className="input-icon">📧</span>
                        </div>
                        <div className="form-group">
                            <select
                                name="course"
                                value={['B.E', 'B.Tech', 'B.Sc', 'B.Com', 'B.A', 'M.E', 'M.Tech', 'MBA', 'MCA', 'Diploma'].includes(formData.course) ? formData.course : 'Others'}
                                onChange={handleChange}
                                required
                                disabled={!isEditing}
                            >
                                <option value="" disabled>Select Course</option>
                                <option value="B.E">B.E</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="B.Sc">B.Sc</option>
                                <option value="B.Com">B.Com</option>
                                <option value="B.A">B.A</option>
                                <option value="M.E">M.E</option>
                                <option value="M.Tech">M.Tech</option>
                                <option value="MBA">MBA</option>
                                <option value="MCA">MCA</option>
                                <option value="Diploma">Diploma</option>
                                <option value="Others">Others</option>
                            </select>
                            <label>Course / Program</label>
                        </div>
                        {(!['B.E', 'B.Tech', 'B.Sc', 'B.Com', 'B.A', 'M.E', 'M.Tech', 'MBA', 'MCA', 'Diploma', ''].includes(formData.course) || formData.course === 'Others') && (
                            <div className="form-group" style={{ marginTop: '0', animation: 'fadeIn 0.3s' }}>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course === 'Others' ? '' : formData.course}
                                    onChange={handleChange}
                                    placeholder="Specify Course"
                                    readOnly={!isEditing}
                                />
                                <label>Specify Course</label>
                            </div>
                        )}
                        <div className="form-group">
                            <input type="text" name="institution" value={formData.institution} onChange={handleChange} readOnly={!isEditing} placeholder=" " />
                            <label>Institution Name</label>
                            <span className="input-icon">🏫</span>
                        </div>
                        <div className="form-group">
                            <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} readOnly={!isEditing} placeholder=" " />
                            <label>Mobile Number</label>
                            <span className="input-icon">📱</span>
                        </div>

                        {/* 2. Basic Academic Info */}
                        <div className="form-group">
                            <input
                                type="text"
                                name="registerNo"
                                placeholder=" "
                                value={formData.registerNo}
                                onChange={handleChange}
                                required
                            />
                            <label>Register / Roll Number</label>
                            <span className="input-icon">🆔</span>
                        </div>

                        <div className="form-group">
                            <select
                                name="department"
                                value={[
                                    'Computer Science and Engineering',
                                    'Information Technology',
                                    'Electronics and Communication Engineering',
                                    'Electrical and Electronics Engineering',
                                    'Mechanical Engineering',
                                    'Civil Engineering',
                                    'Artificial Intelligence & Data Science',
                                    'Computer Science and Business Systems',
                                    'Computer Technology',
                                    'Artificial Intelligence & Machine Learning',
                                    'Science & Humanities',
                                    'Management Studies'
                                ].includes(formData.department) ? formData.department : 'Others'}
                                onChange={(e) => {
                                    if (e.target.value === 'Others') setFormData(prev => ({ ...prev, department: '' }));
                                    else handleChange(e);
                                }}
                                required
                                disabled={!isEditing}
                            >
                                <option value="" disabled>Select Department</option>
                                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                                <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                                <option value="Computer Science and Business Systems">Computer Science and Business Systems</option>
                                <option value="Computer Technology">Computer Technology</option>
                                <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                                <option value="Science & Humanities">Science & Humanities</option>
                                <option value="Management Studies">Management Studies</option>
                                <option value="Others">Others</option>
                            </select>
                            <label>Department</label>
                        </div>
                        {(![
                            'Computer Science and Engineering',
                            'Information Technology',
                            'Electronics and Communication Engineering',
                            'Electrical and Electronics Engineering',
                            'Mechanical Engineering',
                            'Civil Engineering',
                            'Artificial Intelligence & Data Science',
                            'Computer Science and Business Systems',
                            'Computer Technology',
                            'Artificial Intelligence & Machine Learning',
                            'Science & Humanities',
                            'Management Studies',
                            ''
                        ].includes(formData.department) || formData.department === 'Others') && (
                                <div className="form-group" style={{ marginTop: '0', animation: 'fadeIn 0.3s' }}>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department === 'Others' ? '' : formData.department}
                                        onChange={handleChange}
                                        placeholder="Specify Department"
                                        readOnly={!isEditing}
                                    />
                                    <label>Specify Department</label>
                                </div>
                            )}

                        <div className="form-group">
                            <select name="year" value={formData.year} onChange={handleChange} required disabled={!isEditing}>
                                <option value="" disabled></option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                            <label>Year / Semester</label>
                        </div>

                        <div className="form-group">
                            <select name="category" value={formData.category} onChange={handleChange} required disabled={!isEditing}>
                                <option value="" disabled></option>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                                <option value="Others">Others</option>
                            </select>
                            <label>Category</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="number"
                                name="semesterFee"
                                placeholder=" "
                                value={formData.semesterFee}
                                onChange={handleChange}
                                required
                                readOnly={!isEditing}
                            />
                            <label>Current Semester Fee</label>
                            <span className="input-icon">💵</span>
                        </div>

                        {/* 3. Academic Details */}
                        <div className="section-header">
                            <h4>Academic Details</h4>
                        </div>

                        {/* Custom Radio Group: Previous Semester Result */}
                        <div className="form-group">
                            <label className="radio-group-label">Previous Semester Result</label>
                            <div className="radio-group-container" style={{ pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.7 }}>
                                <label className={`radio-card ${formData.prevSemResult === 'Pass' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="prevSemResult"
                                        value="Pass"
                                        checked={formData.prevSemResult === 'Pass'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">✅</span>
                                    <span>Pass</span>
                                </label>
                                <label className={`radio-card ${formData.prevSemResult === 'Backlog' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="prevSemResult"
                                        value="Backlog"
                                        checked={formData.prevSemResult === 'Backlog'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">⚠️</span>
                                    <span>Backlog</span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Radio Group: Scholarship */}
                        <div className="form-group">
                            <label className="radio-group-label">Availing Scholarship?</label>
                            <div className="radio-group-container" style={{ pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.7 }}>
                                <label className={`radio-card ${formData.scholarship === 'Yes' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="scholarship"
                                        value="Yes"
                                        checked={formData.scholarship === 'Yes'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">👍</span>
                                    <span>Yes</span>
                                </label>
                                <label className={`radio-card ${formData.scholarship === 'No' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="scholarship"
                                        value="No"
                                        checked={formData.scholarship === 'No'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">👎</span>
                                    <span>No</span>
                                </label>
                            </div>
                        </div>


                        {/* 4. Family & Financial Details */}
                        <div className="section-header">
                            <h4>Family & Financial Details</h4>
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="parentName"
                                placeholder=" "
                                value={formData.parentName}
                                onChange={handleChange}
                                required
                                readOnly={!isEditing}
                            />
                            <label>Parent / Guardian Name</label>
                            <span className="input-icon">👪</span>
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="occupation"
                                placeholder=" "
                                value={formData.occupation}
                                onChange={handleChange}
                                required
                                readOnly={!isEditing}
                            />
                            <label>Occupation</label>
                            <span className="input-icon">💼</span>
                        </div>

                        <div className="form-group">
                            <select name="income" value={formData.income} onChange={handleChange} required disabled={!isEditing}>
                                <option value="" disabled></option>
                                <option value="Below 1 Lakh">Below 1 Lakh</option>
                                <option value="1 Lakh - 3 Lakhs">1 Lakh - 3 Lakhs</option>
                                <option value="3 Lakhs - 5 Lakhs">3 Lakhs - 5 Lakhs</option>
                                <option value="Above 5 Lakhs">Above 5 Lakhs</option>
                            </select>
                            <label>Annual Family Income</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="number"
                                name="dependents"
                                placeholder=" "
                                value={formData.dependents}
                                onChange={handleChange}
                                required
                            />
                            <label>No. of Dependents</label>
                            <span className="input-icon">👥</span>
                        </div>

                        {/* Custom Radio Group: Residential Area */}
                        <div className="form-group full-width">
                            <label className="radio-group-label">Residential Area</label>
                            <div className="radio-group-container" style={{ pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.7 }}>
                                <label className={`radio-card ${formData.residentialArea === 'Rural' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="residentialArea"
                                        value="Rural"
                                        checked={formData.residentialArea === 'Rural'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">🏡</span>
                                    <span>Rural</span>
                                </label>
                                <label className={`radio-card ${formData.residentialArea === 'Urban' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="residentialArea"
                                        value="Urban"
                                        checked={formData.residentialArea === 'Urban'}
                                        onChange={handleChange}
                                        className="hidden-radio"
                                    />
                                    <span className="radio-icon">🏙️</span>
                                    <span>Urban</span>
                                </label>
                            </div>
                        </div>

                        {/* 5. Request Details */}
                        <div className="section-header">
                            <h4>Concession Request</h4>
                        </div>

                        <div className="form-group">
                            <select name="concessionType" value={formData.concessionType} onChange={handleChange} required>
                                <option value="Partial">Partial Fee Waiver</option>
                                <option value="Full">Full Fee Waiver</option>
                            </select>
                            <label>Type of Concession</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="number"
                                name="amount"
                                placeholder=" "
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                            <label>Concession Amount Requested</label>
                            <span className="input-icon">💰</span>
                        </div>

                        <div className="form-group full-width">
                            <textarea
                                name="reason"
                                placeholder=" "
                                value={formData.reason}
                                onChange={handleChange}
                                required
                            />
                            <label>Reason for Concession</label>
                        </div>

                        {/* 6. Supporting Documents - New UI */}
                        <div className="form-group full-width">
                            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Supporting Documents</h3>

                            <div className="document-upload-grid">
                                {/* Income Certificate */}
                                <div className={`upload-card ${files.incomeCert ? 'has-file' : ''}`}>
                                    <div className="upload-icon-container">
                                        <span className="upload-icon">📄</span>
                                    </div>
                                    <div className="upload-info">
                                        <span className="upload-label">Income Certificate</span>
                                        <span className="upload-status">
                                            {files.incomeCert ? files.incomeCert.name : 'Not Uploaded'}
                                        </span>
                                    </div>
                                    <div className="upload-actions">
                                        {isEditing && (
                                            <label className="upload-btn">
                                                Choose File
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'incomeCert')} accept="image/*,.pdf" hidden />
                                            </label>
                                        )}
                                        {files.incomeCert && (
                                            <button type="button" className="preview-btn" onClick={() => handleLocalPreview(files.incomeCert)}>
                                                👁️
                                            </button>
                                        )}
                                        {files.incomeCert && <span className="check-icon">✔</span>}
                                    </div>
                                </div>

                                {/* Bonafide Certificate */}
                                <div className={`upload-card ${files.bonafideCert ? 'has-file' : ''}`}>
                                    <div className="upload-icon-container">
                                        <span className="upload-icon">🎓</span>
                                    </div>
                                    <div className="upload-info">
                                        <span className="upload-status">
                                            {files.bonafideCert ? files.bonafideCert.name : 'Not Uploaded'}
                                        </span>
                                    </div>
                                    <div className="upload-actions">
                                        {isEditing && (
                                            <label className="upload-btn">
                                                Choose File
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'bonafideCert')} accept="image/*,.pdf" hidden />
                                            </label>
                                        )}
                                        {files.bonafideCert && (
                                            <button type="button" className="preview-btn" onClick={() => handleLocalPreview(files.bonafideCert)}>
                                                👁️
                                            </button>
                                        )}
                                        {files.bonafideCert && <span className="check-icon">✔</span>}
                                    </div>
                                </div>

                                {/* Fee Receipt */}
                                <div className={`upload-card ${files.feeReceipt ? 'has-file' : ''}`}>
                                    <div className="upload-icon-container">
                                        <span className="upload-icon">🧾</span>
                                    </div>
                                    <div className="upload-info">
                                        <span className="upload-status">
                                            {files.feeReceipt ? files.feeReceipt.name : 'Not Uploaded'}
                                        </span>
                                    </div>
                                    <div className="upload-actions">
                                        {isEditing && (
                                            <label className="upload-btn">
                                                Choose File
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'feeReceipt')} accept="image/*,.pdf" hidden />
                                            </label>
                                        )}
                                        {files.feeReceipt && (
                                            <button type="button" className="preview-btn" onClick={() => handleLocalPreview(files.feeReceipt)}>
                                                👁️
                                            </button>
                                        )}
                                        {files.feeReceipt && <span className="check-icon">✔</span>}
                                    </div>
                                </div>

                                {/* Other Document */}
                                <div className={`upload-card ${files.otherDoc ? 'has-file' : ''}`}>
                                    <div className="upload-icon-container">
                                        <span className="upload-icon">📂</span>
                                    </div>
                                    <div className="upload-info">
                                        <span className="upload-status">
                                            {files.otherDoc ? files.otherDoc.name : 'Not Uploaded'}
                                        </span>
                                    </div>
                                    <div className="upload-actions">
                                        {isEditing && (
                                            <label className="upload-btn">
                                                Choose File
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'otherDoc')} accept="image/*,.pdf" hidden />
                                            </label>
                                        )}
                                        {files.otherDoc && (
                                            <button type="button" className="preview-btn" onClick={() => handleLocalPreview(files.otherDoc)}>
                                                👁️
                                            </button>
                                        )}
                                        {files.otherDoc && <span className="check-icon">✔</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 7. Declaration */}
                        {/* 7. Declaration */}
                        <div className="declaration-group">
                            <input
                                type="checkbox"
                                id="declaration"
                                checked={declaration}
                                onChange={(e) => setDeclaration(e.target.checked)}
                            />
                            <label htmlFor="declaration">
                                I hereby declare that the information provided is true to the best of my knowledge.
                            </label>
                        </div>

                    </div>

                    <div className="submit-container">
                        <button type="submit" className="primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>

            {/* My Applications List */}
            <div className="card">
                <h3>My Applications</h3>
                {applications.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't submitted any applications yet.</p>
                    </div>
                ) : (
                    <div className="applications-list">
                        {applications.map((app) => (
                            <div key={app._id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '20px',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div>
                                        <strong>{new Date(app.date).toLocaleDateString()}</strong>
                                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                            {app.concessionType} Waiver - ${app.amount}
                                        </div>
                                    </div>
                                    <span className={`status-badge status-${app.status.toLowerCase()}`}>
                                        {app.status}
                                    </span>
                                </div>

                                {/* Timeline for each application */}
                                <Timeline status={app.status} />

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;
