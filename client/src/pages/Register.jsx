import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useToast } from '../components/Toast';

function Register() {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student' // Default role
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await API.post('/register', {
                name: formData.name,
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role
            });
            addToast('Registration successful! Please login.', 'success');
            navigate('/login');
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Registration failed';
            setError(errorMessage);
        }

    };

    return (
        <div className="auth-wrapper page-container">
            <div className="register-card reveal active">
                <h1 className="login-title">Join the Platform</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', textAlign: 'center' }}>Start managing academic concessions with ease.</p>

                {error && (
                    <div style={{ background: 'var(--soft-pink)', color: '#2a3166', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid #ee7879' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="john@college.edu"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Confirm</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>I am a...</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-soft)', fontFamily: 'inherit' }}
                        >
                            <option value="student">Student Account</option>
                            <option value="admin">Institutional Administrator</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-glow" style={{ marginTop: '10px', width: '100%' }}>
                        Create Account
                    </button>
                </form>
                <p className="auth-link-text" style={{ marginTop: '30px', textAlign: 'center' }}>
                    Already have an account? <Link to="/login" className="auth-link" style={{ color: 'var(--secondary)', fontWeight: '600', textDecoration: 'none' }}>Log in here</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
