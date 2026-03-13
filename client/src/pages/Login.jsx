import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { FileText, Shield, CheckCircle, Bell } from 'lucide-react';
import { useToast } from '../components/Toast';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        // Clear stale user state when landing on login page
        localStorage.removeItem('user');
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/login', { email: email.trim(), password });
            localStorage.setItem('user', JSON.stringify(data.user));
            addToast('Login Successful', 'success');
            if (data.user.role === 'admin') navigate('/admin');
            else navigate('/student');
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Invalid Credentials';
            addToast(`Login Failed: ${errorMessage}`, 'error');
        }

    };

    return (
        <div className="auth-wrapper page-container">
            <div className="login-card reveal active">
                <h1 className="login-title">Log In</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', textAlign: 'center' }}>Enter your credentials to access the platform.</p>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Institutional Email</label>
                        <input type="email" placeholder="name@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Password</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-glow" style={{ marginTop: '10px', width: '100%' }}>
                        Continue
                    </button>
                </form>
                <p className="auth-link-text" style={{ marginTop: '30px', textAlign: 'center' }}>
                    New here? <Link to="/register" className="auth-link" style={{ color: 'var(--secondary)', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
                </p>

                <div className="login-animation-container">
                    <style>
                        {`
                    .login-animation {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 28px;
                        margin-top: 28px;
                        position: relative;
                    }
                    .workflow-icon {
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #ee7879, #2a3166);
                        border-radius: 10px;
                        color: white;
                        box-shadow: 0 8px 18px rgba(0,0,0,0.15);
                        animation: floatIcon 4s ease-in-out infinite;
                    }
                    .workflow-line {
                        width: 60px;
                        height: 3px;
                        background: linear-gradient(90deg, #ee7879, #cae7df);
                        animation: linePulse 2s infinite ease-in-out;
                    }
                    @keyframes floatIcon {
                        0% { transform: translateY(0) }
                        50% { transform: translateY(-6px) }
                        100% { transform: translateY(0) }
                    }
                    @keyframes linePulse {
                        0% { opacity: 0.4 }
                        50% { opacity: 1 }
                        100% { opacity: 0.4 }
                    }
                    .login-animation::before {
                        content: "";
                        position: absolute;
                        width: 240px;
                        height: 140px;
                        background: radial-gradient(circle, #ee7879, #cae7df);
                        opacity: 0.2;
                        filter: blur(45px);
                        z-index: -1;
                        animation: glowPulse 4s infinite ease-in-out;
                    }
                    @keyframes glowPulse {
                        0% { transform: scale(1) }
                        50% { transform: scale(1.1) }
                        100% { transform: scale(1) }
                    }
                    `}
                    </style>
                    <div className="login-animation">
                        <div className="workflow-icon"><FileText size={20} /></div>
                        <div className="workflow-line"></div>
                        <div className="workflow-icon" style={{ animationDelay: '1s' }}><Shield size={20} /></div>
                        <div className="workflow-line" style={{ animationDelay: '0.5s' }}></div>
                        <div className="workflow-icon" style={{ animationDelay: '2s' }}><CheckCircle size={20} /></div>
                        <div className="workflow-line" style={{ animationDelay: '1s' }}></div>
                        <div className="workflow-icon" style={{ animationDelay: '3s' }}><Bell size={20} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
