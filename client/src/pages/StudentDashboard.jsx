import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Timeline from '../components/Timeline';
import NotificationBanner from '../components/NotificationBanner';
import { useToast } from '../components/Toast';

const DEPARTMENTS = [
    "Computer Science and Engineering (CSE)",
    "Computer Science and Business Systems (CSBS)",
    "Information Technology (IT)",
    "Artificial Intelligence and Data Science (AIDS)",
    "Artificial Intelligence and Machine Learning (AIML)",
    "Electronics and Communication Engineering (ECE)",
    "Electrical and Electronics Engineering (EEE)",
    "Mechanical Engineering (MECH)",
    "Civil Engineering (CIVIL)",
    "Mechatronics Engineering",
    "Robotics and Automation",
    "Biotechnology",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Aerospace Engineering",
    "Agricultural Engineering",
    "Production Engineering",
    "Industrial Engineering",
    "Data Science",
    "Cyber Security"
];

const toRoman = (num) => {
    if (!num) return '';
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return roman[num - 1] || num;
};

const maskContact = (num) => {
    if (!num) return '';
    return num.length >= 10 ? '******' + num.slice(-4) : num;
};


function StudentDashboard() {
    const { addToast } = useToast();
    const navigate = useNavigate();
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
        familyIncomeAmount: '', // New Numeric Field
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
        scholarship: '',

        // Academic Performance
        cgpa: '',
        semester: '',
        academicYear: '',

        // Special Conditions
        specialConditions: [],
        parentContact: '',
        hostelStatus: ''
    });

    const [files, setFiles] = useState({
        incomeCert: null,
        bonafideCert: null,
        feeReceipt: null,
        marksheet: null,
        religionProof: null,
        otherDoc: null
    });

    // Declaration State
    const [declaration, setDeclaration] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation State
    const [validationErrors, setValidationErrors] = useState([]);

    // ── Scheme State ────────────────────────────────────────────────────────
    const [selectedScheme, setSelectedScheme] = useState('');
    const [religion, setReligion] = useState('');
    const [marksPercentage, setMarksPercentage] = useState('');
    const [sportsCertificates, setSportsCertificates] = useState([{ level: '', file: null }]);
    const [calculatedConcession, setCalculatedConcession] = useState(null);
    const [schemeStep, setSchemeStep] = useState('details'); // 'details' | 'scheme'
    const [semesterFormat, setSemesterFormat] = useState('numeric'); // 'numeric' | 'roman'
    // ────────────────────────────────────────────────────────────────────────

    // Profile & Edit State
    const [isEditing, setIsEditing] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [showSettingsModal, setShowSettingsModal] = useState(false);

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

                        // Academic Performance
                        cgpa: data.cgpa || '',
                        semester: data.semester || '',
                        academicYear: data.academicYear || '',
                        parentContact: data.parentContact || '',
                        hostelStatus: data.hostelStatus || '',
                    }));

                    // Set existing files metadata
                    if (data.documents) {
                        const mockFiles = {};
                        if (data.documents.incomeCert) mockFiles.incomeCert = { name: data.documents.incomeCert, existing: true };
                        if (data.documents.bonafideCert) mockFiles.bonafideCert = { name: data.documents.bonafideCert, existing: true };
                        if (data.documents.feeReceipt) mockFiles.feeReceipt = { name: data.documents.feeReceipt, existing: true };
                        if (data.documents.marksheet) mockFiles.marksheet = { name: data.documents.marksheet, existing: true };
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
            console.log('[STUDENT] Fetching unread notifications...');
            const { data } = await API.get(`/notifications/${user.id}`);

            console.log(`[STUDENT] Received ${data.length} unread notification(s)`);

            // Backend returns ONLY unread notifications, no need to filter
            setNotifications(data.slice(0, 3)); // Show max 3 at a time

            // IMMEDIATELY mark as read (don't wait 2 seconds)
            // This ensures they won't appear again even if user refreshes quickly
            if (data.length > 0) {
                console.log('[STUDENT] Immediately marking notifications as read...');
                // Mark in background - don't wait for response
                data.forEach(async (notif) => {
                    try {
                        await API.put(`/notifications/${notif._id}/read`);
                        console.log(`[STUDENT] Marked notification ${notif._id} as read`);
                    } catch (err) {
                        console.error('[STUDENT] Failed to mark as read:', notif._id, err);
                    }
                });
            }
        } catch (err) {
            console.warn('[STUDENT] Notification fetch failed:', err.response?.status);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSingleFileChange = (e, fileType) => {
        setFiles({
            ...files,
            [fileType]: e.target.files[0]
        });
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const current = prev.specialConditions || [];
            if (checked) {
                return { ...prev, specialConditions: [...current, value] };
            } else {
                return { ...prev, specialConditions: current.filter(item => item !== value) };
            }
        });
    };

    // ── Scheme Helpers ────────────────────────────────────────────────────
    const SPORTS_POINTS = { Zone: 3, District: 5, State: 10, National: 15, International: 20 };
    const MINORITY_RELIGIONS = ['Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Zoroastrian'];

    const computeSportsConcession = (certs) => {
        const total = certs.reduce((sum, c) => sum + (SPORTS_POINTS[c.level] || 0), 0);
        if (total === 0) return { points: 0, pct: 0 };
        if (total <= 5) return { points: total, pct: 5 };
        if (total <= 10) return { points: total, pct: 10 };
        if (total <= 20) return { points: total, pct: 20 };
        if (total <= 30) return { points: total, pct: 30 };
        return { points: total, pct: 40 };
    };

    const computeMeritConcession = (marks) => {
        const m = parseFloat(marks) || 0;
        if (m >= 90) return 50;
        if (m >= 80) return 30;
        if (m >= 70) return 15;
        return 0;
    };

    const computeGovtConcession = (income) => {
        if ((income || '').includes('Below 1 Lakh')) return 75;
        if ((income || '').includes('1 Lakh - 3 Lakhs')) return 50;
        return 0;
    };

    const computeMinorityConcession = (rel) =>
        MINORITY_RELIGIONS.some(r => r.toLowerCase() === (rel || '').toLowerCase()) ? 50 : 0;

    // Recalculate concession whenever scheme inputs change
    const recalcConcession = (scheme, income, marks, certs, rel) => {
        if (scheme === 'Government Scholarship') {
            setCalculatedConcession({ pct: computeGovtConcession(income), points: null });
        } else if (scheme === 'Merit Scholarship') {
            setCalculatedConcession({ pct: computeMeritConcession(marks), points: null });
        } else if (scheme === 'Sports Quota') {
            const r = computeSportsConcession(certs);
            setCalculatedConcession({ pct: r.pct, points: r.points });
        } else if (scheme === 'Minority Scholarship') {
            setCalculatedConcession({ pct: computeMinorityConcession(rel), points: null });
        } else {
            setCalculatedConcession(null);
        }
    };

    const handleSchemeChange = (scheme) => {
        setSelectedScheme(scheme);
        setSportsCertificates([{ level: '', file: null }]);
        setMarksPercentage('');
        setReligion('');
        setCalculatedConcession(null);
    };

    const handleSportsCertChange = (index, field, value) => {
        const updated = sportsCertificates.map((c, i) => i === index ? { ...c, [field]: value } : c);
        setSportsCertificates(updated);
        recalcConcession(selectedScheme, formData.income, marksPercentage, updated, religion);
    };

    const addSportsCert = () => {
        if (sportsCertificates.length < 10) setSportsCertificates(prev => [...prev, { level: '', file: null }]);
    };

    const removeSportsCert = (index) => {
        const updated = sportsCertificates.filter((_, i) => i !== index);
        setSportsCertificates(updated.length > 0 ? updated : [{ level: '', file: null }]);
        recalcConcession(selectedScheme, formData.income, marksPercentage, updated, religion);
    };
    // ────────────────────────────────────────────────────────────────────────

    // Helper function to check if at least one document is uploaded
    const hasUploadedDocument = () => {
        // Check if at least one file exists (either new upload or existing from profile)
        return Object.values(files).some(file => {
            if (!file) return false;
            // File can be a File object (new upload) or an object with 'existing' flag (loaded from profile)
            return file instanceof File || (typeof file === 'object' && file.existing);
        });
    };

    const handleApply = async (e) => {
        e.preventDefault();
        const errors = [];

        // Validation 1: Declaration
        if (!declaration) errors.push("You must accept the declaration before submitting.");

        // Validation 2: Scheme must be selected (schemeStep must be 'scheme')
        if (schemeStep !== 'scheme') {
            errors.push("Please complete Step 1 (Student Details) and proceed to Step 2 (Scheme Selection).");
        }
        if (!selectedScheme) errors.push("Please select a fee concession scheme.");

        // Validation 3: Scheme-specific document and field checks
        if (selectedScheme === 'Government Scholarship') {
            const hasIncomeCert = files.incomeCert && (files.incomeCert instanceof File || files.incomeCert.existing);
            const hasIncomeValue = formData.income && formData.income.trim() !== '';

            if (!hasIncomeCert && !hasIncomeValue) {
                errors.push("Family Income or Income Certificate is required for Government Scholarship.");
            }
        }
        if (selectedScheme === 'Minority Scholarship') {
            if (!religion) errors.push("Religion is required for Minority Scholarship.");
            const hasReligionProof = files.religionProof && files.religionProof instanceof File;
            if (!hasReligionProof) errors.push("Religion Proof Certificate is required for Minority Scholarship.");
            const hasMarksheet = files.marksheet && (files.marksheet instanceof File || files.marksheet.existing);
            if (!hasMarksheet) errors.push("Marksheet is required for Minority Scholarship.");
        }
        if (selectedScheme === 'Sports Quota') {
            const hasMarksheet = files.marksheet && (files.marksheet instanceof File || files.marksheet.existing);
            if (!hasMarksheet) errors.push("Marksheet is required for Sports Quota.");
            const validCerts = sportsCertificates.filter(c => c.level && c.file);
            if (validCerts.length === 0) errors.push("At least one Sports Certificate (with level and file) is required for Sports Quota.");
        }
        if (selectedScheme === 'Merit Scholarship') {
            if (!marksPercentage) errors.push("Marks Percentage is required for Merit Scholarship.");
            const hasMarksheet = files.marksheet && (files.marksheet instanceof File || files.marksheet.existing);
            if (!hasMarksheet) errors.push("Marksheet is required for Merit Scholarship.");
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setValidationErrors([]);
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('studentId', user.id);

            // All formData fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (key === 'cgpa') data.append(key, Number(value));
                else if (key === 'specialConditions') data.append(key, JSON.stringify(value));
                else data.append(key, value);
            });

            // Scheme fields
            data.append('scheme', selectedScheme);
            if (formData.familyIncomeAmount) data.append('familyIncomeAmount', formData.familyIncomeAmount);
            if (religion) data.append('religion', religion);
            if (marksPercentage) data.append('marksPercentage', marksPercentage);

            // Sports certificates metadata (level info as JSON)
            if (selectedScheme === 'Sports Quota') {
                const certsData = sportsCertificates
                    .filter(c => c.level)
                    .map(c => ({ level: c.level }));
                data.append('sportsCertificatesData', JSON.stringify(certsData));
                // Append sports cert files individually
                sportsCertificates.forEach((cert, idx) => {
                    if (cert.file instanceof File) {
                        data.append(`sportsCert_${idx}`, cert.file);
                    }
                });
            }

            // Standard files (only if new)
            if (files.incomeCert && !files.incomeCert.existing) data.append('incomeCert', files.incomeCert);
            if (files.bonafideCert && !files.bonafideCert.existing) data.append('bonafideCert', files.bonafideCert);
            if (files.feeReceipt && !files.feeReceipt.existing) data.append('feeReceipt', files.feeReceipt);
            if (files.marksheet && !files.marksheet.existing) data.append('marksheet', files.marksheet);
            if (files.religionProof && files.religionProof instanceof File) data.append('religionProof', files.religionProof);
            if (files.otherDoc && !files.otherDoc.existing) data.append('otherDoc', files.otherDoc);

            console.log("[FRONTEND] Sending scheme application:", selectedScheme);
            const response = await API.post('/apply', data);
            console.log("Submission Success:", response.data);

            const concPct = response.data?.concessionPercentage;
            const eligible = response.data?.schemeEligible;
            const reason = response.data?.schemeReason || '';
            if (eligible === false) {
                addToast(`Application submitted, but you may not be eligible for ${selectedScheme}.\nReason: ${reason}`, 'warning');
            } else {
                addToast(`Application Submitted Successfully!\nScheme: ${selectedScheme}\nCalculated Concession: ${concPct}%`, 'success');
            }

            // Reset
            setFormData(prev => ({ ...prev, income: '', reason: '', amount: '', semesterFee: '' }));
            setFiles({ incomeCert: null, bonafideCert: null, feeReceipt: null, marksheet: null, religionProof: null, otherDoc: null });
            setDeclaration(false);
            setSelectedScheme('');
            setReligion('');
            setMarksPercentage('');
            setSportsCertificates([{ level: '', file: null }]);
            setCalculatedConcession(null);
            setSchemeStep('details');
            fetchApplications();
        } catch (err) {
            console.error("Submission Error:", err);
            addToast(`Error submitting application: ${err.response?.data?.error || err.message || "Unknown error"}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNotificationClose = async (id, action = 'close') => {
        console.log(`[STUDENT] Closing notification ${id}, action: ${action}`);

        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n._id !== id));

        // ALWAYS mark as read when closed (regardless of action)
        try {
            await API.put(`/notifications/${id}/read`);
            console.log(`[STUDENT] Notification ${id} marked as read`);
        } catch (err) {
            console.error("[STUDENT] Error marking notification as read:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Preview State
    const [previewData, setPreviewData] = useState(null);

    const handleLocalPreview = async (file) => {
        if (!file) return;

        try {
            if (file instanceof File) {
                // New upload - local preview
                const objectUrl = URL.createObjectURL(file);
                setPreviewData({
                    url: objectUrl,
                    name: file.name,
                    type: file.type
                });
            } else if (file.existing) {
                // Existing file - fetch securely
                const response = await API.get(`/file-preview/${file.name}?userId=${user.id}`, {
                    responseType: 'blob'
                });
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const objectUrl = URL.createObjectURL(blob);
                setPreviewData({
                    url: objectUrl,
                    name: file.name,
                    type: response.headers['content-type']
                });
            }
        } catch (err) {
            console.error("Preview Error:", err);
            addToast("Failed to load file preview. You may not have permission.", 'error');
        }
    };

    const closePreview = () => {
        if (previewData?.url) URL.revokeObjectURL(previewData.url);
        setPreviewData(null);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        try {
            const { data } = await API.post('/change-password', {
                userId: user.id,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess(data.message);
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to change password');
        }
    };

    return (
        <div className="dashboard-container">
            <NotificationBanner notifications={notifications} onClose={handleNotificationClose} />

            {/* Secure Preview Modal */}
            {previewData && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                        <div style={{
                            padding: '20px 30px', borderBottom: '1px solid var(--border-light)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', color: 'white'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{previewData.name}</h3>
                            <button onClick={closePreview} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mint)' }}>
                            {previewData.type.includes('image') ? (
                                <img src={previewData.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            ) : previewData.type.includes('pdf') ? (
                                <iframe src={previewData.url} width="100%" height="100%" title="PDF Preview" style={{ border: 'none', borderRadius: '8px' }} />
                            ) : (
                                <div style={{ color: 'var(--primary)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📁</div>
                                    No visual preview available for this file type.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Navigation Bar (Aligned with Admin) */}
            <nav className="admin-nav-modern">
                {/* Left: Branding */}
                <div className="admin-nav-item active" style={{ fontSize: '1.4rem', fontWeight: '800', cursor: 'pointer' }} onClick={() => navigate('/student')}>
                    FEE CONCESSION
                </div>

                {/* Center: Navigation Links */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '40px' }}>
                    <div className="admin-nav-item" onClick={() => navigate('/student')} style={{ borderBottom: '2px solid #ee7879' }}>Dashboard</div>
                </div>

                {/* Right: Settings */}
                <button className="btn-settings-navy" onClick={() => setShowSettingsModal(true)}>
                    ⚙️ Settings
                </button>
            </nav>

            <header style={{ padding: '0 20px', marginBottom: '20px', marginTop: '40px' }}>
                <h1 className="admin-title-modern" style={{ margin: 0 }}>Student Dashboard</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px', fontWeight: '600' }}>
                    Welcome back, {user.name} | Student Participant
                </div>
            </header>

            <main style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* 1️⃣ Application Form Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary)', fontWeight: '800' }}>Submit Application</h2>
                        {!isLoadingProfile && (
                            <button
                                type="button"
                                className="secondary"
                                style={{ background: isEditing ? 'var(--accent)' : 'var(--primary)', color: 'white' }}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? '✓ View Mode' : '✎ Edit Profile'}
                            </button>
                        )}
                    </div>

                    {validationErrors.length > 0 && (
                        <div style={{ background: 'var(--soft-pink)', border: '1px solid #ee7879', padding: '20px', borderRadius: '12px', marginBottom: '30px', animation: 'fadeIn 0.4s' }}>
                            <div style={{ fontWeight: '700', color: '#2a3166', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>⚠️</span> Please fix the following:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#2a3166', fontSize: '0.95rem' }}>
                                {validationErrors.map((err, idx) => <li key={idx} style={{ marginBottom: '5px' }}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleApply} className="form-grid-modern">
                        {/* Row 1: Read-Only Info */}
                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                    Full Name
                                </label>
                                <input type="text" value={formData.studentName} readOnly className="modern-input" style={{ background: 'var(--mint)', fontWeight: '600' }} />
                            </div>
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    Email Address
                                </label>
                                <input type="text" value={formData.email} readOnly className="modern-input" style={{ background: 'var(--mint)', fontWeight: '600' }} />
                            </div>
                        </div>

                        {/* Row 2: Editable Info */}
                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    </div>
                                    Course
                                </label>
                                <select name="course" value={formData.course} onChange={handleChange} required disabled={!isEditing} className="modern-input">
                                    <option value="" disabled>Select Course</option>
                                    <option value="B.E">Bachelor of Engineering</option>
                                    <option value="B.Tech">Bachelor of Technology</option>
                                    <option value="B.Sc">Bachelor of Science</option>
                                    <option value="MBA">MBA</option>
                                    <option value="MCA">MCA</option>
                                    <option value="Diploma">Diploma</option>
                                </select>
                            </div>
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 7v14"></path><path d="M13 21V7"></path><path d="M21 21V7"></path><path d="M9 21v-4"></path><path d="M7 3l5-2 5 2"></path></svg>
                                    </div>
                                    Department
                                </label>
                                <select name="department" value={formData.department} onChange={handleChange} required disabled={!isEditing} className="modern-input">
                                    <option value="" disabled>Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </div>
                                    Register No.
                                </label>
                                <input type="text" name="registerNo" value={formData.registerNo} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="ID Number" />
                            </div>
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    </div>
                                    Semester Fee
                                </label>
                                <input type="number" name="semesterFee" value={formData.semesterFee} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="Fee Amount" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                                    </div>
                                    Current CGPA
                                </label>
                                <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="0.00" />
                            </div>
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    </div>
                                    Request Amount
                                </label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="Amount Requested" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    Semester
                                </label>
                                <input
                                    type={isEditing && semesterFormat === 'numeric' ? "number" : "text"}
                                    name="semester"
                                    value={semesterFormat === 'roman' ? toRoman(formData.semester) : formData.semester}
                                    onChange={(e) => {
                                        if (semesterFormat === 'roman') {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                                            if (val === '0') return;
                                            setFormData(prev => ({ ...prev, semester: val }));
                                        } else {
                                            handleChange(e);
                                        }
                                    }}
                                    required
                                    readOnly={!isEditing}
                                    className="modern-input"
                                    placeholder="e.g. 5"
                                />
                                {isEditing && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Display:</span>
                                        <div style={{ display: 'flex', background: 'var(--mint)', borderRadius: '15px', padding: '2px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setSemesterFormat('numeric')}
                                                style={{
                                                    padding: '4px 12px', border: 'none', borderRadius: '13px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                                                    background: semesterFormat === 'numeric' ? 'var(--primary)' : 'transparent',
                                                    color: semesterFormat === 'numeric' ? 'white' : 'var(--primary)'
                                                }}
                                            >Numeric</button>
                                            <button
                                                type="button"
                                                onClick={() => setSemesterFormat('roman')}
                                                style={{
                                                    padding: '4px 12px', border: 'none', borderRadius: '13px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                                                    background: semesterFormat === 'roman' ? 'var(--primary)' : 'transparent',
                                                    color: semesterFormat === 'roman' ? 'white' : 'var(--primary)'
                                                }}
                                            >Roman</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group-modern">
                                <label>
                                    <div className="icon-wrapper">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    Academic Year
                                </label>
                                <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="e.g. 2023-2024" />
                            </div>
                        </div>

                        <div className="form-group-modern" style={{ marginTop: '10px' }}>
                            <label>Reason for Concession Request</label>
                            <textarea name="reason" value={formData.reason} onChange={handleChange} required readOnly={!isEditing} className="modern-input" style={{ height: '120px', resize: 'none' }} placeholder="Provide detailed justification..."></textarea>
                        </div>

                        {/* New Fields Section */}
                        <div style={{ gridColumn: '1 / -1', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '20px', fontWeight: '700' }}>Personal & Family Details</h3>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>Parent/Guardian Name</label>
                                <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="Name" />
                            </div>
                            <div className="form-group-modern">
                                <label>Parent Occupation</label>
                                <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="Occupation" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>Parent Contact Number</label>
                                <input
                                    type={isEditing ? "tel" : "text"}
                                    name="parentContact"
                                    value={isEditing ? formData.parentContact : maskContact(formData.parentContact)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData(prev => ({ ...prev, parentContact: val }));
                                    }}
                                    required
                                    readOnly={!isEditing}
                                    className="modern-input"
                                    placeholder="10-digit number"
                                />
                            </div>
                            <div className="form-group-modern">
                                <label>Family Annual Income</label>
                                <input type="number" name="income" value={formData.income} onChange={handleChange} required readOnly={!isEditing} className="modern-input" placeholder="Annual Income" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} required disabled={!isEditing} className="modern-input">
                                    <option value="" disabled>Select Category</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="EWS">EWS</option>
                                </select>
                            </div>
                            <div className="form-group-modern">
                                <label>Hostel Status</label>
                                <select name="hostelStatus" value={formData.hostelStatus} onChange={handleChange} required disabled={!isEditing} className="modern-input">
                                    <option value="" disabled>Select Status</option>
                                    <option value="Hosteller">Hosteller</option>
                                    <option value="Day Scholar">Day Scholar</option>
                                </select>
                            </div>
                        </div>

                        {/* ── STEP 1 COMPLETE BUTTON ─────────────────────────────────────── */}
                        {schemeStep === 'details' && (
                            <div style={{ marginTop: '24px' }}>
                                <button
                                    type="button"
                                    className="btn-glow"
                                    style={{ width: '100%' }}
                                    onClick={() => setSchemeStep('scheme')}
                                >
                                    Continue to Scheme Selection →
                                </button>
                            </div>
                        )}

                        {/* ── STEP 2: SCHEME SELECTION & DOCUMENTS ────────────────────────── */}
                        {schemeStep === 'scheme' && (
                            <>
                                {/* Step 2 Header */}
                                <div style={{ marginTop: '30px', paddingBottom: '10px', borderBottom: '2px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '700' }}>Step 2 — Select Scheme & Upload Documents</h3>
                                    <button type="button" className="secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }} onClick={() => setSchemeStep('details')}>← Back to Details</button>
                                </div>

                                {/* Scheme Selector */}
                                <div className="form-group-modern" style={{ marginTop: '20px' }}>
                                    <label>Fee Concession Scheme</label>
                                    <select
                                        className="modern-input"
                                        value={selectedScheme}
                                        onChange={(e) => {
                                            handleSchemeChange(e.target.value);
                                            recalcConcession(e.target.value, formData.income, marksPercentage, sportsCertificates, religion);
                                        }}
                                        required
                                    >
                                        <option value="">— Select a Scheme —</option>
                                        <option value="Government Scholarship">Government Scholarship</option>
                                        <option value="Minority Scholarship">Minority Scholarship</option>
                                        <option value="Sports Quota">Sports Quota</option>
                                        <option value="Merit Scholarship">Merit Scholarship</option>
                                    </select>
                                </div>

                                {/* ── GOVERNMENT SCHOLARSHIP DOCS ── */}
                                {selectedScheme === 'Government Scholarship' && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ background: 'var(--mint)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                            <strong>Required:</strong> Income Certificate &nbsp;|&nbsp; <strong>Eligibility:</strong> Family income below ₹3 Lakhs/year
                                        </div>
                                        <div className="form-group-modern">
                                            <label>Family Income Per Annum <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <input
                                                type="number"
                                                name="familyIncomeAmount"
                                                value={formData.familyIncomeAmount}
                                                onChange={handleChange}
                                                className="modern-input"
                                                placeholder="e.g. 200000 (numbers only)"
                                                required
                                            />
                                        </div>
                                        <div className="form-group-modern">
                                            <label>Income Certificate <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'incomeCert')} className="modern-input" style={{ padding: '8px', flex: 1 }} />
                                                {files.incomeCert && <button type="button" className="secondary" style={{ padding: '0 15px', borderRadius: '10px' }} onClick={() => handleLocalPreview(files.incomeCert)}>👁</button>}
                                            </div>
                                        </div>
                                        {calculatedConcession !== null && (
                                            <div style={{ marginTop: '12px', padding: '14px 18px', borderRadius: '10px', background: calculatedConcession.pct > 0 ? 'var(--mint)' : 'var(--soft-pink)', border: '1px solid var(--border-light)', fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                                                {calculatedConcession.pct > 0 ? `✅ Estimated Concession: ${calculatedConcession.pct}%` : '❌ Income exceeds threshold — not eligible for Government Scholarship'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── MINORITY SCHOLARSHIP DOCS ── */}
                                {selectedScheme === 'Minority Scholarship' && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ background: 'var(--mint)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                            <strong>Required:</strong> Religion Proof Certificate, Mark Sheet &nbsp;|&nbsp; <strong>Eligible Religions:</strong> Muslim, Christian, Sikh, Buddhist, Jain, Parsi, Zoroastrian
                                        </div>
                                        <div className="form-group-modern">
                                            <label>Religion <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <select className="modern-input" value={religion} onChange={(e) => { setReligion(e.target.value); recalcConcession(selectedScheme, formData.income, marksPercentage, sportsCertificates, e.target.value); }} required>
                                                <option value="">— Select Religion —</option>
                                                {['Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Zoroastrian', 'Hindu', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-row" style={{ marginTop: '12px' }}>
                                            <div className="form-group-modern">
                                                <label>Religion Proof Certificate <span style={{ color: 'var(--accent)' }}>*</span></label>
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'religionProof')} className="modern-input" style={{ padding: '8px' }} />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>Latest Marksheet <span style={{ color: 'var(--accent)' }}>*</span></label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="file" onChange={(e) => handleSingleFileChange(e, 'marksheet')} className="modern-input" style={{ padding: '8px', flex: 1 }} />
                                                    {files.marksheet && <button type="button" className="secondary" style={{ padding: '0 15px', borderRadius: '10px' }} onClick={() => handleLocalPreview(files.marksheet)}>👁</button>}
                                                </div>
                                            </div>
                                        </div>
                                        {calculatedConcession !== null && (
                                            <div style={{ marginTop: '12px', padding: '14px 18px', borderRadius: '10px', background: calculatedConcession.pct > 0 ? 'var(--mint)' : 'var(--soft-pink)', border: '1px solid var(--border-light)', fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                                                {calculatedConcession.pct > 0 ? `✅ Estimated Concession: ${calculatedConcession.pct}%` : '❌ Religion does not qualify for Minority Scholarship'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── SPORTS QUOTA DOCS ── */}
                                {selectedScheme === 'Sports Quota' && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ background: 'var(--mint)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                            <strong>Required:</strong> Sports Certificates + Marksheet &nbsp;|&nbsp; <strong>Points:</strong> Zone=3, District=5, State=10, National=15, International=20
                                        </div>
                                        {/* Marksheet */}
                                        <div className="form-group-modern" style={{ marginBottom: '16px' }}>
                                            <label>Latest Marksheet <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input type="file" onChange={(e) => handleSingleFileChange(e, 'marksheet')} className="modern-input" style={{ padding: '8px', flex: 1 }} />
                                                {files.marksheet && <button type="button" className="secondary" style={{ padding: '0 15px', borderRadius: '10px' }} onClick={() => handleLocalPreview(files.marksheet)}>👁</button>}
                                            </div>
                                        </div>
                                        {/* Sports Certificates */}
                                        <label style={{ fontWeight: '600', color: 'var(--primary)', display: 'block', marginBottom: '10px' }}>Sports Certificates <span style={{ color: 'var(--accent)' }}>*</span></label>
                                        {sportsCertificates.map((cert, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', background: 'var(--mint)', borderRadius: '10px', padding: '10px' }}>
                                                <select
                                                    className="modern-input"
                                                    style={{ flex: '0 0 180px' }}
                                                    value={cert.level}
                                                    onChange={(e) => handleSportsCertChange(idx, 'level', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Certificate Level</option>
                                                    <option value="Zone">Zone (+3 pts)</option>
                                                    <option value="District">District (+5 pts)</option>
                                                    <option value="State">State (+10 pts)</option>
                                                    <option value="National">National (+15 pts)</option>
                                                    <option value="International">International (+20 pts)</option>
                                                </select>
                                                <input
                                                    type="file"
                                                    className="modern-input"
                                                    style={{ padding: '8px', flex: 1 }}
                                                    onChange={(e) => handleSportsCertChange(idx, 'file', e.target.files[0])}
                                                />
                                                {cert.file && <button type="button" className="secondary" style={{ padding: '0 15px', borderRadius: '10px' }} onClick={() => handleLocalPreview(cert.file)}>👁</button>}
                                                {sportsCertificates.length > 1 && (
                                                    <button type="button" onClick={() => removeSportsCert(idx)} style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', padding: '8px 12px', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="secondary" onClick={addSportsCert} style={{ marginBottom: '16px', fontSize: '0.9rem' }}>+ Add Certificate</button>
                                        {/* Points Summary */}
                                        {calculatedConcession !== null && (
                                            <div style={{ padding: '14px 18px', borderRadius: '10px', background: calculatedConcession.pct > 0 ? 'var(--mint)' : 'var(--soft-pink)', border: '1px solid var(--border-light)', fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                                                {calculatedConcession.pct > 0
                                                    ? `✅ Total Points: ${calculatedConcession.points} → Fee Concession: ${calculatedConcession.pct}%`
                                                    : '⚠️ No valid certificates selected yet — add at least one certificate level'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── MERIT SCHOLARSHIP DOCS ── */}
                                {selectedScheme === 'Merit Scholarship' && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ background: 'var(--mint)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                            <strong>Required:</strong> Marksheet &nbsp;|&nbsp; <strong>Concession:</strong> ≥90%→50%, 80–89%→30%, 70–79%→15%
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group-modern">
                                                <label>Marks Percentage <span style={{ color: 'var(--accent)' }}>*</span></label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="modern-input"
                                                    placeholder="e.g. 85.5"
                                                    value={marksPercentage}
                                                    onChange={(e) => {
                                                        setMarksPercentage(e.target.value);
                                                        recalcConcession(selectedScheme, formData.income, e.target.value, sportsCertificates, religion);
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>Latest Marksheet <span style={{ color: 'var(--accent)' }}>*</span></label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="file" onChange={(e) => handleSingleFileChange(e, 'marksheet')} className="modern-input" style={{ padding: '8px', flex: 1 }} />
                                                    {files.marksheet && <button type="button" className="secondary" style={{ padding: '0 15px', borderRadius: '10px' }} onClick={() => handleLocalPreview(files.marksheet)}>👁</button>}
                                                </div>
                                            </div>
                                        </div>
                                        {calculatedConcession !== null && (
                                            <div style={{ marginTop: '12px', padding: '14px 18px', borderRadius: '10px', background: calculatedConcession.pct > 0 ? 'var(--mint)' : 'var(--soft-pink)', border: '1px solid var(--border-light)', fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                                                {calculatedConcession.pct > 0 ? `✅ Estimated Concession: ${calculatedConcession.pct}% (Marks: ${marksPercentage}%)` : `❌ Marks ${marksPercentage}% — below 70%, not eligible for Merit Scholarship`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Declaration */}
                                <div className="form-group-modern" style={{ padding: '20px', background: 'var(--bg-accent)', borderRadius: '12px', marginTop: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', margin: 0 }}>
                                        <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: 'var(--accent)' }} />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '500' }}>
                                            I verify that the above information is correct and I accept all terms of the concession policy.
                                        </span>
                                    </label>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <button type="submit" className="btn-glow" style={{ width: '100%' }} disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting Application...' : 'Apply for Concession'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="card" style={{ animationDelay: '0.2s' }}>
                    <h2 style={{ margin: '0 0 30px', fontSize: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="icon-wrapper">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        Application History
                    </h2>

                    {applications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {applications.map((app) => (
                                <div key={app._id} style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '25px', background: 'var(--mint)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>ID: {app._id.slice(-8).toUpperCase()}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Submitted on {new Date(app.date).toLocaleDateString()} | Sem: {semesterFormat === 'roman' ? toRoman(app.semester) : app.semester}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
                                            background: app.status === 'Approved' ? 'var(--mint)' : app.status === 'Rejected' ? 'var(--accent)' : 'var(--soft-pink)',
                                            color: 'var(--primary)', border: app.status === 'Approved' ? '1px solid var(--primary)' : 'none'
                                        }}>
                                            {app.status.toUpperCase()}
                                        </div>
                                    </div>

                                    {app.status === 'Approved' && (
                                        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                🎉 Congratulations! Your concession is ready.
                                            </div>
                                            <button
                                                className="btn-glow"
                                                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                                onClick={() => navigate(`/student/approval/${app._id}`)}
                                            >
                                                View Approval Details
                                            </button>
                                        </div>
                                    )}

                                    <Timeline status={app.status} updates={app.statusHistory} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
                            <p>No applications found. Complete the form above to get started.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Settings Modal (Identical to Admin) */}
            {showSettingsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button
                            onClick={() => setShowSettingsModal(false)}
                            style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: '#ee7879', border: 'none',
                                color: 'white', width: '35px', height: '35px',
                                borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >✕</button>

                        <h2 style={{ margin: '0 0 10px 0', fontWeight: '800' }}>Student Settings</h2>
                        <p style={{ marginBottom: '30px', opacity: 0.8, fontWeight: '600' }}>Manage your account security and core credentials.</p>

                        <div style={{ background: 'rgba(42, 49, 102, 0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(42, 49, 102, 0.1)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Update Password</h3>

                            {passwordError && <div style={{ color: '#ee7879', marginBottom: '20px', fontWeight: '700', fontSize: '0.9rem' }}>⚠️ {passwordError}</div>}
                            {passwordSuccess && <div style={{ color: 'var(--primary)', background: '#f4abaa', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid var(--primary)' }}>✅ {passwordSuccess}</div>}

                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>CURRENT PASSWORD</label>
                                    <input
                                        type="password"
                                        className="modern-input"
                                        placeholder="••••••••"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        className="modern-input"
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>CONFIRM NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        className="modern-input"
                                        placeholder="••••••••"
                                        value={passwordData.confirmNewPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-glow" style={{ marginTop: '10px' }}>Update Securely</button>
                            </form>
                            <button onClick={handleLogout} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#ee7879', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>Logout Completely</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
