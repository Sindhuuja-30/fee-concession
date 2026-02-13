import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <h1>Fee Concession Platform</h1>
            {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Welcome, {user.name} </span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
