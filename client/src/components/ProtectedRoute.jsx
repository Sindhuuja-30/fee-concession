import { Navigate } from 'react-router-dom';

/**
 * Protected Route Component
 * Restricts access based on authentication and role
 */
function ProtectedRoute({ children, requiredRole }) {
    const user = JSON.parse(localStorage.getItem('user'));

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated but wrong role
    if (requiredRole && user.role !== requiredRole) {
        // Redirect to appropriate dashboard
        const redirectPath = user.role === 'admin' ? '/admin' : '/student';
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                color: '#fff',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</h1>
                <h2>Access Denied</h2>
                <p>You do not have permission to access this page.</p>
                <p style={{ color: '#a0aec0', marginBottom: '2rem' }}>
                    Required role: <strong>{requiredRole}</strong>. Your role: <strong>{user.role}</strong>
                </p>
                <a
                    href={redirectPath}
                    style={{
                        padding: '0.8rem 2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: '600'
                    }}
                >
                    Go to Dashboard
                </a>
            </div>
        );
    }

    // Authenticated and correct role
    return children;
}

export default ProtectedRoute;
