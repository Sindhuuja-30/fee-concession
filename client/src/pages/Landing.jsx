import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, BarChart, CheckCircle, Bell, Shield, ArrowRight } from 'lucide-react';

function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .fade-section').forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page" style={{ minHeight: '100vh', paddingBottom: '20px' }}>
            <style>
                {`
                .landing-page .container {
                    max-width: 1200px;
                    margin: auto;
                    padding: 40px 20px;
                }
                .landing-page .hero-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: 40px;
                    padding: 40px 0;
                }
                .landing-page .hero-title {
                    font-size: 52px;
                    color: #2a3166;
                    font-weight: bold;
                    line-height: 1.2;
                }
                .landing-page .hero-desc {
                    font-size: 18px;
                    margin-top: 15px;
                    line-height: 1.6;
                }
                .landing-page .hero-buttons button {
                    background: linear-gradient(90deg, #ee7879, #2a3166);
                    border: none;
                    border-radius: 30px;
                    padding: 14px 28px;
                    color: white;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    margin-right: 15px;
                }
                .landing-page .hero-buttons button:hover {
                    transform: scale(1.07);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                }
                .landing-page .hero-animation {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    animation: floatHero 6s ease-in-out infinite, fadeInHero 1s ease;
                }
                @keyframes floatHero {
                    0% { transform: translateY(0px) scale(1) }
                    50% { transform: translateY(-15px) scale(1.02) }
                    100% { transform: translateY(0px) scale(1) }
                }
                @keyframes fadeInHero {
                    from { opacity: 0; transform: translateY(20px) }
                    to { opacity: 1; transform: translateY(0) }
                }
                .landing-page .hero-animation::before {
                    content: "";
                    position: absolute;
                    width: 320px;
                    height: 320px;
                    background: radial-gradient(circle, #ee7879, #cae7df);
                    opacity: 0.25;
                    border-radius: 50%;
                    animation: glowPulse 5s ease-in-out infinite;
                    z-index: -1;
                }
                @keyframes glowPulse {
                    0% { transform: scale(1); opacity: 0.25 }
                    50% { transform: scale(1.15); opacity: 0.4 }
                    100% { transform: scale(1); opacity: 0.25 }
                }
                .landing-page .floating-shape {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ee7879, #2a3166);
                    animation: floatShape 8s infinite ease-in-out;
                }
                @keyframes floatShape {
                    0% { transform: translateY(0) }
                    50% { transform: translateY(-20px) }
                    100% { transform: translateY(0) }
                }
                .landing-page .icon {
                    width: 40px;
                    height: 40px;
                    color: #2a3166;
                    margin-bottom: 10px;
                    animation: iconFloat 3s ease-in-out infinite;
                }
                @keyframes iconFloat {
                    0% { transform: translateY(0) }
                    50% { transform: translateY(-5px) }
                    100% { transform: translateY(0) }
                }
                .landing-page .fee-info {
                    text-align: center;
                    margin-top: 80px;
                }
                .landing-page .feature-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 25px;
                    margin-top: 40px;
                }
                .landing-page .feature-card {
                    background: linear-gradient(145deg, #cae7df, #f4abaa);
                    padding: 25px;
                    border-radius: 18px;
                    text-align: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255,255,255,0.3);
                }
                .landing-page .feature-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }
                .landing-page .fade-section {
                    opacity: 0;
                    transform: translateY(40px);
                    animation: fadeUp 0.9s forwards;
                }
                @media(max-width: 900px) {
                    .landing-page .hero-section {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    .landing-page .feature-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}
            </style>

            <div className="page-container" style={{ padding: 0, maxWidth: '100%', animation: 'fadeIn 0.6s ease' }}>
                {/* Hero Section */}
                <section id="home" className="container fade-section">
                    <div className="hero-section">
                        <div className="hero-text entrance-left">
                            <h1 className="hero-title">
                                Smart & Simple <br /><span style={{ color: '#ee7879' }}>Fee Concession</span> Management
                            </h1>
                            <p className="hero-desc">
                                Streamline applications, appraisals, and notifications with one powerful system designed for modern institutions.
                            </p>
                            <div className="hero-buttons" style={{ marginTop: '30px' }}>
                                <button onClick={() => navigate('/register')}>
                                    Apply Now
                                </button>
                                <button onClick={() => navigate('/login')} style={{ background: '#cae7df', color: '#2a3166', border: '2px solid #2a3166' }}>
                                    Admin Login
                                </button>
                            </div>
                        </div>
                        <div className="entrance-right" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                            <div className="hero-animation" style={{ width: '100%', height: '300px', position: 'relative' }}>
                                <div className="floating-shape" style={{ top: '10%', left: '10%', width: '30px', height: '30px', animationDelay: '0s' }}></div>
                                <div className="floating-shape" style={{ bottom: '20%', right: '15%', width: '20px', height: '20px', animationDelay: '2s' }}></div>
                                <div className="floating-shape" style={{ top: '30%', right: '5%', width: '15px', height: '15px', animationDelay: '4s' }}></div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', zIndex: 2 }}>
                                    <FileText size={60} color="#2a3166" className="icon" />
                                    <ArrowRight size={30} color="#ee7879" />
                                    <ClipboardCheck size={70} color="#ee7879" className="icon" style={{ animationDelay: '1s' }} />
                                    <ArrowRight size={30} color="#ee7879" />
                                    <CheckCircle size={80} color="#f4abaa" className="icon" style={{ animationDelay: '2s' }} />
                                    <ArrowRight size={30} color="#ee7879" />
                                    <Bell size={60} color="#2a3166" className="icon" style={{ animationDelay: '0.5s' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fee Concession Management System */}
                <section id="features" className="fee-info container fade-section">
                    <h2 style={{ fontSize: '36px', color: '#2a3166', marginBottom: '20px' }}>Fee Concession Management System</h2>
                    <div className="feature-grid">
                        <div className="feature-card">
                            <FileText size={40} className="icon" style={{ margin: '0 auto 15px auto', display: 'block' }} color="#2a3166" />
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Simple Student Application</h3>
                        </div>
                        <div className="feature-card">
                            <ClipboardCheck size={40} className="icon" style={{ margin: '0 auto 15px auto', display: 'block' }} color="#2a3166" />
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Transparent Admin Review</h3>
                        </div>
                        <div className="feature-card">
                            <BarChart size={40} className="icon" style={{ margin: '0 auto 15px auto', display: 'block' }} color="#2a3166" />
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Eligibility Score Calculation</h3>
                        </div>
                        <div className="feature-card">
                            <Bell size={40} className="icon" style={{ margin: '0 auto 15px auto', display: 'block' }} color="#2a3166" />
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Instant Notification Updates</h3>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="about" className="section fade-section" style={{ marginTop: '80px' }}>
                    <div className="container">
                        <h2 className="how-title reveal" style={{ fontSize: '36px', color: '#2a3166', textAlign: 'center', marginBottom: '40px' }}>How it Works</h2>
                        <div className="how-steps reveal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>

                            {/* Step 1 */}
                            <div className="step-card" style={{ background: 'linear-gradient(145deg, #cae7df, #f4abaa)', borderRadius: '20px', padding: '25px', textAlign: 'center', width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                <div className="step-number" style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(90deg, #ee7879, #2a3166)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: 'auto', marginBottom: '10px' }}>1</div>
                                <FileText size={30} color="#2a3166" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Submit Application</h3>
                                <p style={{ color: '#2a3166', fontSize: '0.95rem' }}>Upload your request and necessary verification documents digitally.</p>
                            </div>

                            <div className="connect-line" style={{ height: '4px', width: '60px', background: 'linear-gradient(90deg, #ee7879, #2a3166)' }}></div>

                            {/* Step 2 */}
                            <div className="step-card" style={{ background: 'linear-gradient(145deg, #cae7df, #f4abaa)', borderRadius: '20px', padding: '25px', textAlign: 'center', width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                <div className="step-number" style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(90deg, #ee7879, #2a3166)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: 'auto', marginBottom: '10px' }}>2</div>
                                <ClipboardCheck size={30} color="#2a3166" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Admin Reviews</h3>
                                <p style={{ color: '#2a3166', fontSize: '0.95rem' }}>Administrators quickly verify submitted proof and eligibility criteria.</p>
                            </div>

                            <div className="connect-line" style={{ height: '4px', width: '60px', background: 'linear-gradient(90deg, #ee7879, #2a3166)' }}></div>

                            {/* Step 3 */}
                            <div className="step-card" style={{ background: 'linear-gradient(145deg, #cae7df, #f4abaa)', borderRadius: '20px', padding: '25px', textAlign: 'center', width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                <div className="step-number" style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(90deg, #ee7879, #2a3166)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: 'auto', marginBottom: '10px' }}>3</div>
                                <BarChart size={30} color="#2a3166" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Score Calculation</h3>
                                <p style={{ color: '#2a3166', fontSize: '0.95rem' }}>Smart system evaluates parameters to recommend a fair concession rate.</p>
                            </div>

                            <div className="connect-line" style={{ height: '4px', width: '60px', background: 'linear-gradient(90deg, #ee7879, #2a3166)' }}></div>

                            {/* Step 4 */}
                            <div className="step-card" style={{ background: 'linear-gradient(145deg, #cae7df, #f4abaa)', borderRadius: '20px', padding: '25px', textAlign: 'center', width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                <div className="step-number" style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(90deg, #ee7879, #2a3166)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: 'auto', marginBottom: '10px' }}>4</div>
                                <Bell size={30} color="#2a3166" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Approval & Notification</h3>
                                <p style={{ color: '#2a3166', fontSize: '0.95rem' }}>Get instant alerts and view your modified fee structure securely online.</p>
                            </div>

                        </div>

                        {/* Animated Illustration Replacement */}
                        <div className="how-animation reveal" style={{ marginTop: '50px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={50} color="#2a3166" className="icon" />
                                <ArrowRight size={30} color="#ee7879" />
                                <ClipboardCheck size={50} color="#2a3166" className="icon" style={{ animationDelay: '1s' }} />
                                <ArrowRight size={30} color="#ee7879" />
                                <CheckCircle size={50} color="#2a3166" className="icon" style={{ animationDelay: '2s' }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="section fade-section" style={{ marginTop: '80px', marginBottom: '80px' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <div className="cta-block">
                            <h2 className="cta-title" style={{ fontSize: '36px', color: '#2a3166', marginBottom: '20px' }}>Make Fee Management Effortless</h2>
                            <p style={{ opacity: 0.9, marginBottom: '40px', fontSize: '1.2rem' }}>
                                Join hundreds of students and admins using our platform for transparent concessions.
                            </p>
                            <div className="hero-buttons">
                                <button onClick={() => navigate('/register')} style={{ padding: '18px 50px', fontSize: '1.2rem', background: 'linear-gradient(90deg, #ee7879, #2a3166)', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>
                                    Get Started Today
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <section id="contact" style={{ marginTop: '80px', padding: '40px 0', background: 'rgba(255,255,255,0.1)' }}>
                    <div className="container footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                        <div className="reveal">
                            <div className="brand-font" style={{ fontSize: '1.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
                                FEE <span style={{ color: '#ee7879' }}>CONCESSION</span>
                            </div>
                            <p style={{ color: '#2a3166' }}>
                                The leading platform for managing academic fee concessions with transparency and speed.
                            </p>
                        </div>
                        <div className="reveal">
                            <h4 style={{ marginBottom: '24px' }}>Quick Links</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                                <li><a href="#home" className="nav-link" style={{ textDecoration: 'none', color: '#2a3166', fontWeight: '600' }}>Home</a></li>
                                <li><a href="#features" className="nav-link" style={{ textDecoration: 'none', color: '#2a3166', fontWeight: '600' }}>Features</a></li>
                                <li><a href="#about" className="nav-link" style={{ textDecoration: 'none', color: '#2a3166', fontWeight: '600' }}>About</a></li>
                                <li><a href="#contact" className="nav-link" style={{ textDecoration: 'none', color: '#2a3166', fontWeight: '600' }}>Contact</a></li>
                            </ul>
                        </div>
                        <div className="reveal">
                            <h4 style={{ marginBottom: '24px' }}>Contact</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', color: '#2a3166', padding: 0 }}>
                                <li>support@feeconcession.edu</li>
                                <li>+1 (555) 000-1111</li>
                                <li>Academic Block 1, University St.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Landing;
