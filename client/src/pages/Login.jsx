import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login Successful');
            if (data.user.role === 'admin') navigate('/admin');
            else navigate('/student');
        } catch (err) {
            alert('Invalid Credentials');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="primary">Login</button>
            </form>
            <p style={{ marginTop: '10px' }}>
                Don't have an account? <Link to="/">Register</Link>
            </p>
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                <strong>Demo Credentials:</strong><br />
                Admin: admin@college.edu / admin123<br />
                Student: student@college.edu / student123
            </p>
        </div>
    );
}

export default Login;
