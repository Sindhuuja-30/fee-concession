import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { jsPDF } from 'jspdf';
import { FileText, Download, ArrowLeft, CheckCircle, Calendar, User, BookOpen, Percent, ShieldCheck } from 'lucide-react';

const toRoman = (num) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return roman[num - 1] || num;
};

function ApprovalDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const { data } = await API.get('/all'); // Fetching from all and filtering for simplicity, or we could add a specific route
                const found = data.find(app => app._id === id);

                if (!found) {
                    setError('Application not found.');
                    return;
                }

                if (found.status !== 'Approved') {
                    setError('This application is not yet approved.');
                    return;
                }

                setApplication(found);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError('Failed to load application details.');
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [id]);

    const handleDownloadPDF = () => {
        if (!application) return;

        const doc = jsPDF();
        const margin = 20;
        let y = 30;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(42, 49, 102); // Primary color
        doc.text('Fee Concession Approval Letter', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });

        y += 10;
        doc.setDrawColor(238, 120, 121); // Accent color
        doc.setLineWidth(1);
        doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);

        // Student Details Section
        y += 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Details', margin, y);

        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const details = [
            ['Student Name:', application.studentName],
            ['Register Number:', application.registerNo],
            ['Department:', application.department],
            ['Course:', `${application.course} (${toRoman(application.semester)} Sem)`]
        ];

        details.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), margin + 60, y);
            y += 8;
        });

        // Application Details Section
        y += 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(42, 49, 102);
        doc.text('Application Details', margin, y);

        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const appDetails = [
            ['Scheme Applied:', application.scheme || 'N/A'],
            ['Points Awarded:', String(application.sportsPoints || application.incomePoints || 0)],
            ['Concession Granted:', `${application.finalApprovedRate}%`]
        ];

        appDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), margin + 60, y);
            y += 8;
        });

        // Approval Details Section
        y += 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(42, 49, 102);
        doc.text('Approval Verification', margin, y);

        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const approvalDetails = [
            ['Approved By:', application.approvedBy || 'Admin Committee'],
            ['Approval Date:', application.approvalDate ? new Date(application.approvalDate).toLocaleDateString() : new Date().toLocaleDateString()],
            ['Status:', 'OFFICIALLY APPROVED']
        ];

        approvalDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), margin + 60, y);
            y += 8;
        });

        // Footer / Signature Area
        y += 40;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + 60, y);
        doc.line(doc.internal.pageSize.getWidth() - margin - 60, y, doc.internal.pageSize.getWidth() - margin, y);

        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Admin Signature', margin + 10, y);
        doc.text('Institutional Seal', doc.internal.pageSize.getWidth() - margin - 50, y);

        y += 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('This is a computer-generated document. No physical signature is required for initial verification.', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });

        doc.save(`Approval_Letter_${application.registerNo}.pdf`);
    };

    if (loading) return (
        <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="loader">Loading Approval Details...</div>
        </div>
    );

    if (error) return (
        <div className="dashboard-container" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ background: 'var(--soft-pink)', padding: '30px', borderRadius: '15px', border: '1px solid #ee7879' }}>
                <h2 style={{ color: 'var(--primary)' }}>⚠️ {error}</h2>
                <button onClick={() => navigate('/student')} className="secondary" style={{ marginTop: '20px' }}>Back to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <nav className="admin-nav-modern">
                <div className="admin-nav-item active" style={{ fontSize: '1.4rem', fontWeight: '800', cursor: 'pointer' }} onClick={() => navigate('/student')}>
                    FEE CONCESSION
                </div>
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '40px' }}>
                    <div className="admin-nav-item" onClick={() => navigate('/student')}>Dashboard</div>
                    <div className="admin-nav-item active" style={{ borderBottom: '2px solid #ee7879' }}>Approval Details</div>
                </div>
            </nav>

            <header style={{ padding: '0 20px', marginBottom: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-title-modern" style={{ margin: 0 }}>Approval Details</h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px', fontWeight: '600' }}>
                        Successfully approved for {application.scheme}
                    </div>
                </div>
                <button onClick={() => navigate('/student')} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
            </header>

            <main style={{ padding: '0 20px' }}>
                <div className="charts-grid" style={{ gridTemplateColumns: 'minmax(400px, 1.5fr) 1fr', gap: '30px' }}>

                    {/* Summary Section */}
                    <div className="chart-card" style={{ padding: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--mint)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--primary)' }}>
                                <CheckCircle size={32} color="var(--primary)" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary)', fontWeight: '800' }}>Concession Granted</h2>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ee7879' }}>{application.finalApprovedRate}% Deduction</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '20px' }}>
                            <div style={{ background: 'rgba(42, 49, 102, 0.03)', padding: '20px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <User size={14} /> Student Information
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{application.studentName}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.8 }}>Reg No: {application.registerNo}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.8 }}>{application.department}</div>
                            </div>

                            <div style={{ background: 'rgba(42, 49, 102, 0.03)', padding: '20px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <BookOpen size={14} /> Scheme Details
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{application.scheme}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.8 }}>Evaluated Points: {application.sportsPoints || application.incomePoints || 0}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.8 }}>Semester: {toRoman(application.semester)}</div>
                            </div>

                            <div style={{ background: 'rgba(42, 49, 102, 0.03)', padding: '20px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <ShieldCheck size={14} /> Approval Meta
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{application.approvedBy || 'Institutional Committee'}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.8 }}>Date: {application.approvalDate ? new Date(application.approvalDate).toLocaleDateString() : 'N/A'}</div>
                            </div>

                            <div style={{ background: 'rgba(42, 49, 102, 0.03)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ee7879' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <Percent size={14} /> Net Benefit
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ee7879' }}>{application.finalApprovedRate}% OFF</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>Applied to Semester Fee</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', padding: '20px', background: 'var(--bg-accent)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '500', lineHeight: '1.6' }}>
                                <strong>Note:</strong> This concession has been granted based on internal evaluation of your academic/financial/sports performance. Please download the approval letter and submit it to the Accounts Office for fee adjustment.
                            </p>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="chart-card" style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <FileText size={60} color="var(--primary)" style={{ opacity: 0.2 }} />
                            </div>
                            <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: '800' }}>Official Approval Letter</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
                                Generate and download your formal fee concession document for institutional records.
                            </p>
                            <button className="btn-glow" onClick={handleDownloadPDF} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                <Download size={20} /> Download Approval Letter
                            </button>
                        </div>

                        <div className="chart-card" style={{ padding: '25px', background: 'var(--mint)' }}>
                            <h4 style={{ margin: '0 0 15px', color: 'var(--primary)', fontWeight: '800' }}>Next Steps</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                                <li style={{ marginBottom: '8px' }}>Download the PDF letter.</li>
                                <li style={{ marginBottom: '8px' }}>Visit the college accounts office.</li>
                                <li style={{ marginBottom: '8px' }}>Provide your Register Number for verification.</li>
                                <li>The concession will be reflected in your wallet.</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default ApprovalDetails;
