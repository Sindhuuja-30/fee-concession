import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import NotificationBanner from '../components/NotificationBanner';
import FileViewerModal from '../components/FileViewerModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import { LayoutDashboard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

function AdminDashboard() {
    const { addToast } = useToast();
    const user = JSON.parse(localStorage.getItem('user'));
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
    const [notifications, setNotifications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [applicationFilter, setApplicationFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [decisions, setDecisions] = useState([]);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Approval/Rejection Workflow State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processingApp, setProcessingApp] = useState(null);
    const [newRate, setNewRate] = useState(0);
    const [rejectReason, setRejectReason] = useState('');
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        // Emergency Force Scroll Fix
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";

        fetchApplications();
        fetchNotifications();
        fetchDecisions();
        // Poll for notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchApplications = async () => {
        try {
            const { data } = await API.get('/all');
            setApplications(data);
            calculateStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDecisions = async () => {
        try {
            const { data } = await API.get('/decisions');
            setDecisions(data);
        } catch (err) {
            console.error('Error fetching decisions:', err);
        }
    };

    const fetchNotifications = async () => {
        try {
            console.log('[ADMIN] Fetching unread notifications...');
            const { data } = await API.get(`/notifications/${user.id}`);

            console.log(`[ADMIN] Received ${data.length} unread notification(s)`);

            // Backend now returns ONLY unread notifications, no need to filter
            setNotifications(data); // Show all unread (backend already filtered)

            // IMMEDIATELY mark as read (don't wait 2 seconds)
            if (data.length > 0) {
                console.log('[ADMIN] Immediately marking notifications as read...');
                // Mark in background - don't wait for response
                data.forEach(async (notif) => {
                    try {
                        await API.put(`/notifications/${notif._id}/read`);
                        console.log(`[ADMIN] Marked notification ${notif._id} as read`);
                    } catch (err) {
                        console.error('[ADMIN] Failed to mark as read:', notif._id, err);
                    }
                });
            }
        } catch (err) {
            console.warn('[ADMIN] Notification fetch failed:', err);
        }
    };

    const handleNotificationClose = async (id, action = 'close', relatedId = null) => {
        console.log(`[ADMIN] Closing notification ${id}, action: ${action}`);

        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n._id !== id));

        // ALWAYS mark as read when closed (regardless of action)
        try {
            await API.put(`/notifications/${id}/read`);
            console.log(`[ADMIN] Notification ${id} marked as read`);
        } catch (err) {
            console.error("[ADMIN] Error marking notification as read:", err);
        }

        // Handle 'view' action to open application details
        if (action === 'view' && relatedId) {
            const app = applications.find(a => a._id === relatedId);
            if (app) {
                setSelectedApplication(app);
                setIsAppModalOpen(true);
            } else {
                addToast('Application details not found in current list.', 'error');
            }
        }
    };


    const calculateStats = (data) => {
        setStats({
            total: data.length,
            approved: data.filter(a => a.status === 'Approved').length,
            pending: data.filter(a => a.status === 'Pending').length,
            rejected: data.filter(a => a.status === 'Rejected').length
        });
    };

    const openApproveModal = (app) => {
        setProcessingApp(app);
        setNewRate(app.recommendedConcessionRate || 0); // Default to recommended
        setShowApproveModal(true);
    };

    const openRejectModal = (app) => {
        setProcessingApp(app);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const confirmStatusUpdate = async (status) => {
        if (!processingApp) return;
        const id = processingApp._id;

        // Ensure we have the current admin user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || !currentUser.id) {
            addToast("Admin session not found. Please log in again.", 'error');
            return;
        }

        // Optimistic Update Data
        const updatePayload = {
            id,
            status,
            adminId: currentUser.id
        };

        if (status === 'Approved') {
            updatePayload.finalApprovedRate = newRate;
        } else {
            updatePayload.rejectionReason = rejectReason;
        }

        const previousApplications = [...applications];

        // Optimistic UI Update
        setApplications(prev => prev.map(app =>
            app._id === id ? { ...app, status, ...updatePayload } : app
        ));

        // Update Stats
        const appToUpdate = applications.find(a => a._id === id);
        if (appToUpdate && appToUpdate.status !== status) {
            setStats(prev => ({
                ...prev,
                pending: prev.pending - (appToUpdate.status === 'Pending' ? 1 : 0),
                approved: prev.approved + (status === 'Approved' ? 1 : 0) - (appToUpdate.status === 'Approved' ? 1 : 0),
                rejected: prev.rejected + (status === 'Rejected' ? 1 : 0) - (appToUpdate.status === 'Rejected' ? 1 : 0)
            }));
        }

        try {
            const response = await API.post('/status', updatePayload);

            // On Success:
            addToast(response.data.message || `Application ${status} successfully.`, 'success');

            // Sync with backend
            await fetchApplications();

            // Refresh notifications too
            fetchNotifications();
            fetchDecisions();

            setShowApproveModal(false);
            setShowRejectModal(false);
            setProcessingApp(null);

            // Close details modal if open
            setIsAppModalOpen(false);
            setSelectedApplication(null);
        } catch (err) {
            console.error('Error updating status:', err);
            addToast(`Failed to update status: ${err.response?.data?.error || err.message}`, 'error');

            // Partial rollback/sync 
            fetchApplications();
        }
    };

    const handleDelete = async () => {
        if (!applicationToDelete) return;

        const appId = applicationToDelete._id;

        try {
            // Call DELETE endpoint with adminId
            await API.delete(`/applications/${appId}`, {
                data: { adminId: user.id }
            });

            // Sync with backend
            await fetchApplications();

            // Close modal and reset state
            setShowDeleteModal(false);
            setApplicationToDelete(null);

            // Close details modal if open
            setIsAppModalOpen(false);
            setSelectedApplication(null);

            addToast('Application deleted successfully', 'success');
        } catch (err) {
            console.error('Error deleting application:', err);
            addToast(err.response?.data?.error || 'Failed to delete application. Please try again.', 'error');
        }
    };

    const filteredApplications = applicationFilter === 'all'
        ? applications
        : applications.filter(app => app.status === applicationFilter);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [initialPreviewFile, setInitialPreviewFile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openFileModal = (files, fileToPreview = null) => {
        setSelectedFiles(files || []);
        setInitialPreviewFile(fileToPreview);
        setIsModalOpen(true);
    };

    const closeFileModal = () => {
        setIsModalOpen(false);
        setSelectedFiles([]);
        setInitialPreviewFile(null);
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
        <div className="admin-page-bg">
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <NotificationBanner
                    notifications={notifications}
                    onClose={handleNotificationClose}
                />
                <FileViewerModal
                    isOpen={isModalOpen}
                    onClose={closeFileModal}
                    files={selectedFiles}
                    initialPreview={initialPreviewFile}
                />

                {/* Approve Modal */}
                {showApproveModal && processingApp && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '800' }}>
                                ✓ Approve Application
                            </h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                                    Approved Concession Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    value={newRate}
                                    onChange={(e) => setNewRate(Number(e.target.value))}
                                    step="5" min="0" max="100"
                                />
                                <div style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                                    Recommended Rate: <strong>{processingApp.recommendedConcessionRate}%</strong>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button className="secondary" onClick={() => { setShowApproveModal(false); setProcessingApp(null); }}>Cancel</button>
                                <button onClick={() => confirmStatusUpdate('Approved')}>Confirm Approval</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && processingApp && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ background: '#f4abaa' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '800' }}>
                                ✕ Reject Application
                            </h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                                    Reason for Rejection
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Provide a reason..."
                                    rows="4"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button className="secondary" onClick={() => { setShowRejectModal(false); setProcessingApp(null); }}>Cancel</button>
                                <button onClick={() => confirmStatusUpdate('Rejected')} style={{ background: '#ee7879' }}>Confirm Rejection</button>
                            </div>
                        </div>
                    </div>
                )}

                <ApplicationDetailModal
                    application={selectedApplication}
                    onClose={() => {
                        setIsAppModalOpen(false);
                        setSelectedApplication(null);
                    }}
                    onStatusUpdate={async (id, status) => {
                        // Forward to handleStatus logic or confirmation
                        if (status === 'Approved') openApproveModal(selectedApplication);
                        else if (status === 'Rejected') openRejectModal(selectedApplication);
                    }}
                />

                {/* Delete Confirmation Modal */}
                {showDeleteModal && applicationToDelete && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ background: '#ee7879' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '800' }}>
                                ⚠️ Delete Application?
                            </h3>
                            <p style={{ marginBottom: '20px', fontWeight: '500' }}>
                                This action is permanent. Student: <strong>{applicationToDelete.studentName}</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button className="secondary" onClick={() => { setShowDeleteModal(false); setApplicationToDelete(null); }}>Cancel</button>
                                <button onClick={handleDelete} style={{ background: '#2a3166' }}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-Navigation Bar */}
                <nav className="admin-nav-modern">
                    {/* Left: Branding */}
                    <div className="admin-nav-item active" style={{ fontSize: '1.4rem', fontWeight: '800', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
                        FEE CONCESSION
                    </div>

                    {/* Center: Navigation Links */}
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '40px' }}>
                        <div className="admin-nav-item" onClick={() => navigate('/admin')} style={{ borderBottom: '2px solid #ee7879' }}>Dashboard</div>
                        <div className="admin-nav-item" onClick={() => navigate('/admin/analytics')}>Analytics</div>
                    </div>

                    {/* Right: Settings */}
                    <button className="btn-settings-navy" onClick={() => setShowSettingsModal(true)}>
                        ⚙️ Settings
                    </button>
                </nav>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 className="admin-title-modern" style={{ margin: 0 }}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label style={{ fontWeight: '800', fontSize: '1rem' }}>Filter Status:</label>
                        <select
                            value={applicationFilter}
                            onChange={(e) => setApplicationFilter(e.target.value)}
                            style={{ width: '200px' }}
                        >
                            <option value="all">All Applications</option>
                            <option value="Pending">Pending Only</option>
                            <option value="Approved">Approved Only</option>
                            <option value="Rejected">Rejected Only</option>
                        </select>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-container">
                    <style>
                        {`
                        .stats-container {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                            gap: 20px;
                            margin-top: 20px;
                            margin-bottom: 30px;
                        }
                        .stat-card {
                            display: flex;
                            align-items: center;
                            gap: 18px;
                            padding: 22px;
                            border-radius: 16px;
                            color: white;
                            box-shadow: 0 12px 25px rgba(0,0,0,0.15);
                            transition: transform 0.3s ease, box-shadow 0.3s ease;
                        }
                        .stat-card:hover {
                            transform: translateY(-6px);
                            box-shadow: 0 18px 35px rgba(0,0,0,0.25);
                        }
                        .stat-icon {
                            width: 52px;
                            height: 52px;
                            border-radius: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(255,255,255,0.2);
                        }
                        .stat-info h4 {
                            font-size: 14px;
                            opacity: 0.9;
                            margin: 0 0 4px 0;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .stat-info h2 {
                            font-size: 32px;
                            font-weight: 700;
                            margin: 0;
                        }
                        `}
                    </style>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #2a3166, #ee7879)' }}>
                        <div className="stat-icon"><LayoutDashboard size={24} /></div>
                        <div className="stat-info">
                            <h4>Total</h4>
                            <h2>{stats.total}</h2>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f4abaa, #ee7879)' }}>
                        <div className="stat-icon"><Clock size={24} /></div>
                        <div className="stat-info">
                            <h4>Pending</h4>
                            <h2>{stats.pending}</h2>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #cae7df, #2a3166)' }}>
                        <div className="stat-icon"><CheckCircle size={24} /></div>
                        <div className="stat-info">
                            <h4>Approved</h4>
                            <h2>{stats.approved}</h2>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ee7879, #f4abaa)' }}>
                        <div className="stat-icon"><XCircle size={24} /></div>
                        <div className="stat-info">
                            <h4>Rejected</h4>
                            <h2>{stats.rejected}</h2>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Score</th>
                                <th>Income Pts</th>
                                <th>Recommendation</th>
                                <th>Docs</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Rec %</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((app) => (
                                <tr key={app._id} onClick={() => { setSelectedApplication(app); setIsAppModalOpen(true); }} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 700 }}>
                                        {app.studentName}<br />
                                        <small style={{ fontWeight: 'normal', opacity: 0.7 }}>{app.registerNo}</small>
                                    </td>
                                    <td>
                                        <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontWeight: '700' }}>
                                            {app.eligibilityScore}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                            {app.incomePoints || 0}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: '700',
                                            color: app.adminRecommendation === 'Strongly Recommended' ? '#ee7879' : 'var(--primary)',
                                            fontSize: '0.85rem'
                                        }}>
                                            {app.adminRecommendation || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <button style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); openFileModal(app.documents); }}>
                                            View ({app.documents?.length || 0})
                                        </button>
                                    </td>
                                    <td>{app.concessionType}</td>
                                    <td>${app.amount}</td>
                                    <td>{app.recommendedConcessionRate}%</td>
                                    <td>
                                        <span style={{
                                            padding: '6px 14px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '700',
                                            background: app.status === 'Approved' ? 'var(--mint)' : app.status === 'Rejected' ? 'var(--accent)' : 'var(--soft-pink)',
                                            color: 'var(--primary)', border: app.status === 'Approved' ? '1px solid var(--primary)' : 'none'
                                        }}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                            {app.status === 'Pending' && (
                                                <>
                                                    <button style={{ padding: '8px 14px' }} onClick={() => openApproveModal(app)}>✓</button>
                                                    <button style={{ padding: '8px 14px', background: 'var(--accent)' }} onClick={() => openRejectModal(app)}>✕</button>
                                                </>
                                            )}
                                            <button className="secondary" style={{ padding: '8px 14px' }} onClick={() => { setApplicationToDelete(app); setShowDeleteModal(true); }}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {applications.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', fontWeight: '600' }}>No applications found.</div>
                    )}
                </div>

                {/* Settings Modal (Moved from main section) */}
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

                            <h2 style={{ margin: '0 0 10px 0', fontWeight: '800' }}>Administrative Settings</h2>
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
                                            placeholder="••••••••"
                                            value={passwordData.confirmNewPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" style={{ padding: '15px', marginTop: '10px', fontSize: '1rem' }}>
                                        SYNC NEW CREDENTIALS
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Application Decision History Section */}
                <div className="section-reveal" style={{ marginBottom: '60px', marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '800' }}>
                            Application Decision History
                        </h2>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Student</th>
                                    <th>Register Number</th>
                                    <th>Scheme Type</th>
                                    <th>Amount</th>
                                    <th>Decision</th>
                                    <th>Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decisions.map((decision) => (
                                    <tr key={decision._id}>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {new Date(decision.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{decision.studentName}</td>
                                        <td>{decision.registerNo}</td>
                                        <td>{decision.schemeType}</td>
                                        <td>${decision.amount}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700',
                                                background: decision.decision === 'Approved' ? 'var(--mint)' : 'var(--accent)',
                                                color: 'var(--primary)'
                                            }}>
                                                {decision.decision}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{decision.adminName}</div>
                                            <small style={{ opacity: 0.7 }}>{decision.adminRole}</small>
                                        </td>
                                    </tr>
                                ))}
                                {decisions.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '30px', textAlign: 'center', fontWeight: '600' }}>
                                            No decision history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
