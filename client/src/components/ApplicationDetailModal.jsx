import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileViewerModal from './FileViewerModal';

const ApplicationDetailModal = ({ application, onClose, onStatusUpdate }) => {
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
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

    if (!application) return null;

    const handleFileView = () => {
        setIsFileModalOpen(true);
    };

    const handleAction = async (id, status) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await onStatusUpdate(id, status);
        } catch (error) {
            console.error("Action failed", error);
            setIsProcessing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100 // Higher than standard modal if needed, but standard is fine
        }}>
            <div style={{
                background: '#1e1e1e',
                borderRadius: '15px',
                width: '600px',
                maxWidth: '95%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                color: '#fff',
                position: 'relative',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <div style={{
                    padding: '20px 30px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexShrink: 0
                }}>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#e0e0e0',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            transition: 'all 0.2s',
                            zIndex: 10,
                            position: 'relative',
                            userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.transform = 'translateX(-3px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#e0e0e0';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>←</span> Back
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
                        Application Details
                    </h2>
                </div>

                <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>

                        {/* 1. Basic Info */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px', marginBottom: '5px', color: '#00d2ff' }}>Basic Information</div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Student Name</label>
                            <div style={{ fontWeight: 'bold' }}>{application.studentName}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Email / Mobile</label>
                            <div>{application.email || '-'} / {application.mobile || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Course / Institution</label>
                            <div>{application.course || '-'} <br /> <small style={{ color: '#666' }}>{application.institution || '-'}</small></div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Register No</label>
                            <div>{application.registerNo}</div>
                        </div>

                        {/* 2. Academic */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px', marginBottom: '5px', marginTop: '10px', color: '#00d2ff' }}>Academic Details</div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Department / Year</label>
                            <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{application.department} / {application.year}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Category</label>
                            <div>{application.category || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Semester Fee</label>
                            <div>{application.semesterFee ? `$${application.semesterFee}` : '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Prev Sem Result</label>
                            <div>{application.prevSemResult || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Scholarship Available?</label>
                            <div>{application.scholarship || '-'}</div>
                        </div>

                        {/* 3. Family */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px', marginBottom: '5px', marginTop: '10px', color: '#00d2ff' }}>Family & Financial</div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Parent Name</label>
                            <div>{application.parentName || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Occupation</label>
                            <div>{application.occupation}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Annual Income</label>
                            <div>{application.income}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Residential Area</label>
                            <div>{application.residentialArea || '-'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Dependents</label>
                            <div>{application.dependents || '-'}</div>
                        </div>

                        {/* 4. Request */}
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px', marginBottom: '5px', marginTop: '10px', color: '#00d2ff' }}>Request Details</div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Type</label>
                            <div>{application.concessionType}</div>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Amount Requested</label>
                            <div style={{ color: '#00e676', fontWeight: 'bold' }}>${application.amount}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Reason</label>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px', marginTop: '5px' }}>
                                {application.reason}
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Documents</label>
                            <div style={{ marginTop: '5px' }}>
                                {application.documents && application.documents.length > 0 ? (
                                    <button
                                        onClick={handleFileView}
                                        style={{
                                            background: '#3f51b5',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        📄 View {application.documents.length} File(s)
                                    </button>
                                ) : (
                                    <span style={{ color: '#666' }}>No documents attached</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', gap: '15px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {application.status === 'Pending' && onStatusUpdate && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(application._id, 'Approved');
                                    }}
                                    disabled={isProcessing}
                                    style={{
                                        flex: 1,
                                        background: isProcessing ? '#1b5e20' : '#00e676',
                                        color: isProcessing ? '#ccc' : '#000',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: isProcessing ? 'wait' : 'pointer',
                                        opacity: isProcessing ? 0.7 : 1,
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {isProcessing ? 'Processing...' : 'Approve Application'}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(application._id, 'Rejected');
                                    }}
                                    disabled={isProcessing}
                                    style={{
                                        flex: 1,
                                        background: isProcessing ? '#b71c1c' : '#ff1744',
                                        color: isProcessing ? '#ccc' : '#fff',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: isProcessing ? 'wait' : 'pointer',
                                        opacity: isProcessing ? 0.7 : 1,
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {isProcessing ? 'Processing...' : 'Reject Application'}
                                </button>
                            </>
                        )}
                        {application.status !== 'Pending' && (
                            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: application.status === 'Approved' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', borderRadius: '8px', color: application.status === 'Approved' ? '#00e676' : '#ff1744', border: `1px solid ${application.status === 'Approved' ? '#00e676' : '#ff1744'}` }}>
                                Status: {application.status}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FileViewerModal
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                files={application.documents || []}
            />

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ApplicationDetailModal;
