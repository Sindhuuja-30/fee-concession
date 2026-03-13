import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileViewerModal from './FileViewerModal';

const toRoman = (num) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return roman[num - 1] || num;
};


const ApplicationDetailModal = ({ application, onClose, onStatusUpdate }) => {
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [initialPreviewFile, setInitialPreviewFile] = useState(null);
    const navigate = useNavigate();

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleBack = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (onClose) {
            onClose();
        } else {
            // Fallback for route-based usage
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/admin'); // Default fallback
            }
        }
    };

    const openFileModal = (files, fileToPreview = null) => {
        setInitialPreviewFile(fileToPreview);
        setIsFileModalOpen(true);
    };

    const handleAction = async (id, status) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await onStatusUpdate(id, status);
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getDocumentLabel = (filename) => {
        if (!filename) return "Unknown Document";
        if (filename === application.incomeCert) return "Income Certificate";
        if (filename === application.bonafideCert) return "Bonafide Certificate";
        if (filename === application.feeReceipt) return "Fee Receipt";
        if (filename === application.marksheet) return "Latest Marksheet";
        if (filename === application.religionProof) return "Religion Proof";
        if (filename === application.otherDoc) return "Other Document";

        // Check sports certificates
        if (application.sportsCertificates && application.sportsCertificates.length > 0) {
            const cert = application.sportsCertificates.find(c => c.filename === filename);
            if (cert) return `Sports Certificate (${cert.level})`;
        }

        return "Submitted Document";
    };

    if (!application) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{
                padding: 0,
                width: '700px',
                maxWidth: '95%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '25px 35px',
                    borderBottom: '2px solid #2a3166',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '25px',
                    flexShrink: 0,
                    background: '#2a3166',
                    borderTopLeftRadius: '18px',
                    borderTopRightRadius: '18px'
                }}>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            background: '#cae7df',
                            border: '1px solid #cae7df',
                            borderRadius: '25px',
                            color: '#2a3166',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 20px',
                            transition: 'all 0.3s ease',
                            fontWeight: '800'
                        }}
                    >
                        <span>←</span> BACK
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#cae7df', fontWeight: '800' }}>
                        Application Record
                    </h2>
                </div>

                <div style={{ padding: '35px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

                        {/* 1. Basic Info */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Data Profile</div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Student Identity</label>
                            <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{application.studentName}</div>
                            <small style={{ color: '#2a3166' }}>ID: {application.registerNo}</small>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Contact Channel</label>
                            <div style={{ fontWeight: '600' }}>{application.email || '-'}</div>
                            <div style={{ fontSize: '0.9rem' }}>{application.mobile || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Education Track</label>
                            <div style={{ fontWeight: '700' }}>{application.course}</div>
                            <div style={{ fontSize: '0.85rem' }}>{application.institution}</div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Departmental Unit</label>
                            <div style={{ fontWeight: '700' }}>{application.department}</div>
                            <div style={{ fontSize: '0.85rem' }}>Year: {application.year} | Sem: {toRoman(application.semester)}</div>
                        </div>


                        {/* 2. Performance */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Academic Performance</div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Current CGPA</label>
                            <div style={{ color: '#2a3166', fontWeight: '900', fontSize: '1.5rem', background: '#f4abaa', display: 'inline-block', padding: '5px 15px', borderRadius: '12px', border: '1px solid #2a3166' }}>
                                {application.cgpa || '-'}
                            </div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Concession Category</label>
                            <div style={{ fontWeight: '700' }}>{application.category || 'General'}</div>
                            <div style={{ fontSize: '0.85rem' }}>{application.concessionType}</div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Fee Structure</label>
                            <div style={{ fontWeight: '700' }}>${application.semesterFee} <small>(Semester)</small></div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Scholarship Status</label>
                            <div style={{ fontWeight: '700' }}>{application.scholarship || 'None'}</div>
                        </div>

                        {/* 3. Request Details */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Concession Logic</div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Requested Quantum</label>
                            <div style={{ color: '#ee7879', fontWeight: '900', fontSize: '1.5rem' }}>${application.amount}</div>
                        </div>
                        <div>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Priority Score</label>
                            <div style={{ color: '#2a3166', fontWeight: '800' }}>{application.eligibilityScore}% Matches Criteria</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Narration of Need</label>
                            <div style={{ background: '#f4abaa', padding: '15px', borderRadius: '12px', marginTop: '8px', border: '1px solid #2a3166', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>
                                {application.reason}
                            </div>
                        </div>

                        {/* 4. Scheme-Specific Recommendation Profile */}
                        {(application.sportsPoints > 0 || application.scheme === 'Sports Quota') ? (
                            <>
                                <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Sports Profile</div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Total Sports Points</label>
                                    <div style={{ color: '#ee7879', fontWeight: '900', fontSize: '1.5rem' }}>
                                        {application.sportsPoints || 0} <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>PTS</span>
                                    </div>
                                    <small style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Based on Certificates</small>
                                </div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Certificate Count</label>
                                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#2a3166' }}>
                                        {application.sportsCertificates?.length || 0} Documents
                                    </div>
                                </div>
                            </>
                        ) : (application.scheme === 'Government Scholarship' || application.incomePoints > 0) ? (
                            <>
                                <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Financial Profile</div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Reported Family Income</label>
                                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#2a3166' }}>
                                        ₹{application.familyIncomeAmount?.toLocaleString() || '0'}
                                    </div>
                                    <small style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Per Annum</small>
                                </div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Income-Based Points</label>
                                    <div style={{ color: '#ee7879', fontWeight: '900', fontSize: '1.5rem' }}>
                                        {application.incomePoints || 0} <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>PTS</span>
                                    </div>
                                </div>
                            </>
                        ) : application.scheme === 'Merit Scholarship' ? (
                            <>
                                <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Merit Profile</div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Marks Percentage</label>
                                    <div style={{ color: '#ee7879', fontWeight: '900', fontSize: '1.5rem' }}>
                                        {application.marksPercentage}%
                                    </div>
                                </div>
                            </>
                        ) : application.scheme === 'Minority Scholarship' ? (
                            <>
                                <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Minority Profile</div>
                                <div>
                                    <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Religion</label>
                                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#2a3166' }}>
                                        {application.religion || 'Not Specified'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #2a3166', paddingBottom: '8px', marginBottom: '10px', marginTop: '15px', color: '#2a3166', fontWeight: '800', fontSize: '1.1rem' }}>Eligibility Profile</div>
                        )}

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>System Recommendation</label>
                            <div style={{
                                background: application.adminRecommendation === 'Strongly Recommended' ? '#ee7879' : (application.adminRecommendation === 'Recommended' ? '#cae7df' : '#f4abaa'),
                                color: application.adminRecommendation === 'Strongly Recommended' ? 'white' : '#2a3166',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                marginTop: '8px',
                                border: '1px solid #2a3166',
                                fontSize: '1.1rem',
                                fontWeight: '800',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {application.adminRecommendation || 'No Recommendation Generated'}
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
                            <label style={{ color: '#2a3166', fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Supporting Documentation</label>
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {application.documents && application.documents.length > 0 ? (
                                    application.documents.map((doc, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: '#f4abaa',
                                            padding: '12px 18px',
                                            borderRadius: '12px',
                                            border: '1px solid #2a3166'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '1.4rem' }}>
                                                    {doc.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}
                                                </span>
                                                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#2a3166' }}>{getDocumentLabel(doc)}</span>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '600' }}>{doc}</div>

                                            </div>
                                            <button
                                                onClick={() => openFileModal(application.documents, doc)}
                                                className="btn-view-navy"
                                                style={{ padding: '6px 15px', fontSize: '0.8rem' }}
                                            >
                                                EYE PREVIEW
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <span style={{ color: '#ee7879', fontWeight: '700' }}>No verification media attached.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', display: 'flex', gap: '20px', paddingTop: '25px', borderTop: '2px solid #2a3166' }}>
                        {application.status === 'Pending' && onStatusUpdate && (
                            <>
                                <button
                                    onClick={() => handleAction(application._id, 'Approved')}
                                    disabled={isProcessing}
                                    className="btn-approve-mint"
                                    style={{ flex: 1, padding: '15px', fontSize: '1rem' }}
                                >
                                    {isProcessing ? 'SYNCHRONIZING...' : '✓ APPROVE CONCESSION'}
                                </button>
                                <button
                                    onClick={() => handleAction(application._id, 'Rejected')}
                                    disabled={isProcessing}
                                    className="btn-delete-coral"
                                    style={{ flex: 1, padding: '15px', fontSize: '1rem' }}
                                >
                                    {isProcessing ? 'TERMINATING...' : '✕ REJECT REQUEST'}
                                </button>
                            </>
                        )}
                        {application.status !== 'Pending' && (
                            <div style={{
                                flex: 1, textAlign: 'center', padding: '15px',
                                background: application.status === 'Approved' ? '#2a3166' : '#ee7879',
                                borderRadius: '12px',
                                color: application.status === 'Approved' ? '#cae7df' : '#2a3166',
                                border: '2px solid #2a3166',
                                fontWeight: '900',
                                fontSize: '1.2rem',
                                letterSpacing: '1px'
                            }}>
                                STATUS: {application.status.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FileViewerModal
                isOpen={isFileModalOpen}
                onClose={() => {
                    setIsFileModalOpen(false);
                    setInitialPreviewFile(null);
                }}
                files={application.documents || []}
                initialPreview={initialPreviewFile}
            />

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ApplicationDetailModal;
