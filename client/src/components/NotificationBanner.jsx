import { useEffect } from 'react';

function NotificationBanner({ notifications, onClose }) {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="notification-container" style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            {notifications.map((notif) => (
                <div key={notif._id} className={`notification-toast type-${notif.type}`} style={{
                    background: notif.type === 'success' ? '#cae7df' :
                        notif.type === 'info' ? '#f4abaa' : '#ee7879',
                    border: '3px solid #2a3166',
                    borderRadius: '16px',
                    color: '#2a3166',
                    boxShadow: '0 15px 45px rgba(42, 49, 102, 0.2)',
                    width: '400px',
                    animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{
                            fontSize: '1.5rem', background: '#2a3166',
                            padding: '10px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {notif.type === 'info' ? 'ℹ️' : notif.type === 'success' ? '✅' : '⚠️'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '900', marginBottom: '5px', fontSize: '1rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                {notif.type === 'info' ? 'SYSTEM UPDATE' : notif.type === 'success' ? 'ACTION GRANTED' : 'SECURE ALERT'}
                            </div>
                            <div style={{ fontSize: '0.95rem', color: '#2a3166', lineHeight: '1.5', fontWeight: '600' }}>
                                {notif.message}
                            </div>
                        </div>
                        <button
                            onClick={() => onClose(notif._id)}
                            style={{
                                background: 'rgba(42, 49, 102, 0.1)', border: 'none',
                                color: '#2a3166', cursor: 'pointer',
                                padding: '8px', fontSize: '1.2rem',
                                borderRadius: '50%', width: '30px', height: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Actions Row */}
                    <div style={{
                        background: 'rgba(42, 49, 102, 0.05)',
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '15px',
                        borderTop: '2px solid #2a3166'
                    }}>
                        {notif.relatedId && (
                            <button
                                onClick={() => onClose(notif._id, 'view', notif.relatedId)}
                                style={{
                                    background: '#2a3166',
                                    border: 'none',
                                    color: '#cae7df',
                                    fontWeight: '800',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    padding: '6px 15px',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                VIEW RECORD
                            </button>
                        )}
                        <button
                            onClick={() => onClose(notif._id, 'read')}
                            style={{
                                background: 'transparent',
                                border: '1px solid #2a3166',
                                color: '#2a3166',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                textTransform: 'uppercase'
                            }}
                        >
                            ACKNOWLEDGE
                        </button>
                    </div>
                </div>
            ))}
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(110%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-toast:hover {
                    transform: translateX(-5px);
                    transition: transform 0.2s ease;
                }
            `}</style>
        </div>
    );
}

export default NotificationBanner;
