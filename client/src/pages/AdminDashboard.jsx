import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import NotificationBanner from '../components/NotificationBanner';
import FileViewerModal from '../components/FileViewerModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';

function AdminDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
    const [notifications, setNotifications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Emergency Force Scroll Fix
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";

        fetchApplications();
        fetchNotifications();
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

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get(`/notifications/${user.id}`);
            // Show unread notifications, but limit to prevent spam if too many
            setNotifications(data.filter(n => !n.isRead));
        } catch (err) {
            console.error('Error fetching notifications');
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Error marking notification as read', err);
        }
    };

    const handleNotificationClose = (id, action = 'close', relatedId = null) => {
        // If just closing, remove from UI immediately (dismiss)
        // If action is 'read', mark as read on server
        if (action === 'read' || action === 'view') {
            handleMarkAsRead(id);
        } else {
            // Just dismiss from view for this session
            setNotifications(prev => prev.filter(n => n._id !== id));
        }

        if (action === 'view' && relatedId) {
            const app = applications.find(a => a._id === relatedId);
            if (app) {
                setSelectedApplication(app);
                setIsAppModalOpen(true);
            } else {
                // If app not in current list (maybe pagination later?), try fetching or just alert
                // For now, assume it's in the list since we load all
                alert('Application details not found in current list.');
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

    const handleStatus = async (id, status) => {
        if (updatingId === id) return; // Prevent double clicks
        setUpdatingId(id);

        // 1. Optimistic Update
        const previousApplications = [...applications];
        setApplications(prev => prev.map(app =>
            app._id === id ? { ...app, status } : app
        ));

        // Update stats optimistically as well
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
            // 2. API Call
            await API.post('/status', { id, status });
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status. Reverting changes.');
            // 3. Revert on Error
            setApplications(previousApplications);
            calculateStats(previousApplications);
        } finally {
            setUpdatingId(null);
        }
    };

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openFileModal = (files) => {
        setSelectedFiles(files || []);
        setIsModalOpen(true);
    };

    const closeFileModal = () => {
        setIsModalOpen(false);
        setSelectedFiles([]);
    };

    return (
        <div>
            <div className="admin-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <div className="admin-content" style={{ flex: 1, overflowY: 'auto' }}>
                    <NotificationBanner
                        notifications={notifications}
                        onClose={handleNotificationClose}
                    />
                    <FileViewerModal
                        isOpen={isModalOpen}
                        onClose={closeFileModal}
                        files={selectedFiles}
                    />
                    <ApplicationDetailModal
                        application={selectedApplication}
                        onClose={() => {
                            setIsAppModalOpen(false);
                            setSelectedApplication(null);
                        }}
                        onStatusUpdate={async (id, status) => {
                            await handleStatus(id, status);
                            setIsAppModalOpen(false); // Close modal after action
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '50%',
                                    color: '#fff',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    transition: 'background 0.2s'
                                }}
                                title="Back to Home"
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                                ←
                            </button>
                            <h2>Admin Dashboard</h2>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)' }}>Welcome, Admin</div>
                    </div>

                    <div className="card" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
                            <div style={{ color: '#aaa' }}>Total</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,234,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,234,0,0.3)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffea00' }}>{stats.pending}</div>
                            <div style={{ color: '#ffea00' }}>Pending</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(0,230,118,0.1)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.3)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00e676' }}>{stats.approved}</div>
                            <div style={{ color: '#00e676' }}>Approved</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,23,68,0.1)', borderRadius: '10px', border: '1px solid rgba(255,23,68,0.3)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff1744' }}>{stats.rejected}</div>
                            <div style={{ color: '#ff1744' }}>Rejected</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>All Applications</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Docs</th>
                                    <th>Cost/Reason</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr
                                        key={app._id}
                                        onClick={() => {
                                            setSelectedApplication(app);
                                            setIsAppModalOpen(true);
                                        }}
                                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td>
                                            <strong>{app.studentName}</strong><br />
                                            <small style={{ color: 'rgba(255,255,255,0.5)' }}>{app.registerNo}</small>
                                        </td>
                                        <td>
                                            {app.documents && app.documents.length > 0 ? (
                                                <div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openFileModal(app.documents);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            color: '#fff',
                                                            padding: '5px 10px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        <span>📄</span> View Files ({app.documents.length})
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ opacity: 0.5 }}>No Docs</span>
                                            )}
                                        </td>
                                        <td>
                                            <div>{app.concessionType}</div>
                                            <small style={{ color: 'rgba(255,255,255,0.5)' }}>{app.income}</small>
                                        </td>
                                        <td>${app.amount}</td>
                                        <td>
                                            <span className={`status-badge status-${app.status.toLowerCase()}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>
                                            {/* Action Buttons: Show only if Pending */}
                                            {app.status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        title="Approve Application"
                                                        disabled={updatingId === app._id}
                                                        style={{
                                                            background: updatingId === app._id ? '#555' : '#00e676',
                                                            border: 'none',
                                                            padding: '8px 12px',
                                                            borderRadius: '5px',
                                                            color: '#000',
                                                            fontWeight: 'bold',
                                                            cursor: updatingId === app._id ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: '35px',
                                                            opacity: updatingId === app._id ? 0.6 : 1,
                                                            transition: 'transform 0.1s'
                                                        }}
                                                        onMouseEnter={(e) => !updatingId && (e.currentTarget.style.transform = 'scale(1.05)')}
                                                        onMouseLeave={(e) => !updatingId && (e.currentTarget.style.transform = 'scale(1)')}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatus(app._id, 'Approved');
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        title="Reject Application"
                                                        disabled={updatingId === app._id}
                                                        style={{
                                                            background: updatingId === app._id ? '#555' : '#ff1744',
                                                            border: 'none',
                                                            padding: '8px 12px',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            cursor: updatingId === app._id ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: '35px',
                                                            opacity: updatingId === app._id ? 0.6 : 1,
                                                            transition: 'transform 0.1s'
                                                        }}
                                                        onMouseEnter={(e) => !updatingId && (e.currentTarget.style.transform = 'scale(1.05)')}
                                                        onMouseLeave={(e) => !updatingId && (e.currentTarget.style.transform = 'scale(1)')}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatus(app._id, 'Rejected');
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>
                                                    {app.status === 'Approved' ? '✓ Done' : '✕ Done'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {applications.length === 0 && <p className="empty-state">No applications found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
