import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isLandingPage = location.pathname === '/';

    return (
        <nav className="navbar">
            <div className="logo brand-font" style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'white' }} onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/')}>
                FEE CONCESSION
            </div>

            <div className="nav-links">
                {(!user || user.role !== 'admin') && (
                    <>
                        <Link to="/" className="nav-link">Home</Link>
                        {isLandingPage && (
                            <>
                                <a href="#features" className="nav-link">Features</a>
                                <a href="#about" className="nav-link">About</a>
                                <a href="#contact" className="nav-link">Contact</a>
                            </>
                        )}
                    </>
                )}

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {user.role === 'admin' ? (
                            <span style={{ fontWeight: '800', color: 'white', letterSpacing: '1px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 15px', borderRadius: '15px' }}>ADMIN</span>
                        ) : (
                            <span style={{ fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>{user.name.toUpperCase()}</span>
                        )}
                        <button onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {location.pathname !== '/login' && (
                            <button className="secondary" onClick={() => navigate('/login')}>
                                Login
                            </button>
                        )}
                        {location.pathname !== '/register' && (
                            <button onClick={() => navigate('/register')}>
                                Get Started
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
