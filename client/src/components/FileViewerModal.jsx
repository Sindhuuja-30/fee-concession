import React, { useState, useEffect } from 'react';

const FileViewerModal = ({ isOpen, onClose, files }) => {
    const [previewFile, setPreviewFile] = useState(null);

    // Base URL for uploads
    const BASE_URL = 'http://localhost:5000/uploads/';

    // Reset preview when modal closes or files change
    useEffect(() => {
        if (!isOpen) {
            setPreviewFile(null);
            document.body.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePreview = (file) => {
        const url = `${BASE_URL}${file}`;
        const isPdf = file.toLowerCase().endsWith('.pdf');
        const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);

        if (isPdf || isImage) {
            setPreviewFile({ name: file, url, isPdf, isImage });
        } else {
            // Fallback for other files - just download/open in new tab
            window.open(url, '_blank');
        }
    };

    const handleBackToList = () => {
        setPreviewFile(null);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#1e1e1e',
                borderRadius: '12px',
                width: previewFile ? '90%' : '500px', // Wider when previewing
                height: previewFile ? '90vh' : 'auto', // Taller when previewing
                maxWidth: '1200px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {previewFile && (
                            <button
                                onClick={handleBackToList}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                                title="Back to file list"
                            >
                                ← Back
                            </button>
                        )}
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                            {previewFile ? previewFile.name : `Attached Files (${files.length})`}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0 5px',
                            lineHeight: 1
                        }}
                        title="Close"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    {previewFile ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                            {/* Preview Controls */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <a
                                    href={previewFile.url}
                                    download
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    ⬇ Download
                                </a>
                            </div>

                            {/* Actual Preview */}
                            <div style={{ flex: 1, background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {previewFile.isPdf ? (
                                    <iframe
                                        src={previewFile.url}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 'none' }}
                                        title="PDF Preview"
                                    />
                                ) : previewFile.isImage ? (
                                    <img
                                        src={previewFile.url}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{ color: '#aaa' }}>Preview not available</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // File List View
                        <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
                            {files.length === 0 ? (
                                <p style={{ color: '#aaa', textAlign: 'center', marginTop: '20px' }}>No files found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {files.map((file, index) => {
                                        const isPdf = file.toLowerCase().endsWith('.pdf');
                                        const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);

                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '15px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                transition: 'background 0.2s'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>
                                                        {isPdf ? '📄' : (isImage ? '🖼️' : '📁')}
                                                    </span>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={file}>
                                                            {file}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                                            {isPdf ? 'PDF Document' : (isImage ? 'Image File' : 'File')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {(isPdf || isImage) && (
                                                        <button
                                                            onClick={() => handlePreview(file)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: '#3f51b5',
                                                                border: 'none',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.9rem',
                                                                transition: 'transform 0.1s'
                                                            }}
                                                        >
                                                            Preview
                                                        </button>
                                                    )}
                                                    <a
                                                        href={`${BASE_URL}${file}`}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            color: 'white',
                                                            textDecoration: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        ⬇
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileViewerModal;
