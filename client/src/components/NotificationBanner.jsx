import { useEffect } from 'react';

function NotificationBanner({ notifications, onClose }) {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="notification-container" style={{
            position: 'fixed',
            bottom: '30px', // Move to bottom-right for less intrusion
            right: '30px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        }}>
            {notifications.map((notif) => (
                <div key={notif._id} className={`notification-toast type-${notif.type}`} style={{
                    background: '#252526', // Darker card background
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#eee',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    width: '350px',
                    animation: 'slideIn 0.3s ease-out',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '15px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ fontSize: '1.2rem' }}>
                            {notif.type === 'info' ? 'ℹ️' : notif.type === 'success' ? '✅' : '⚠️'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '0.95rem' }}>
                                {notif.type === 'info' ? 'New Update' : notif.type === 'success' ? 'Success' : 'Attention'}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.4' }}>
                                {notif.message}
                            </div>
                        </div>
                        <button
                            onClick={() => onClose(notif._id)} // This acts as dismiss/close
                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0 5px', fontSize: '1.1rem' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Actions Row */}
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '10px 15px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        borderTop: '1px solid #333'
                    }}>
                        {notif.relatedId && (
                            <button
                                onClick={() => onClose(notif._id, 'view', notif.relatedId)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64B5F6',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                View Application
                            </button>
                        )}
                        <button
                            onClick={() => onClose(notif._id, 'read')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#aaa',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            Mark as Read
                        </button>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .type-success { border-left: 4px solid #00e676 !important; }
                .type-error { border-left: 4px solid #ff1744 !important; }
                .type-info { border-left: 4px solid #2196F3 !important; }
            `}</style>
        </div>
    );
}

export default NotificationBanner;
