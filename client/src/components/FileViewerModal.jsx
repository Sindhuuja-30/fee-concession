import React, { useState, useEffect } from 'react';
import API from '../api';
import mammoth from 'mammoth';
import { useToast } from './Toast';

const FileViewerModal = ({ isOpen, onClose, files, initialPreview = null }) => {
    const { addToast } = useToast();
    const [previewFile, setPreviewFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewFile && previewFile.url) {
                URL.revokeObjectURL(previewFile.url);
            }
        };
    }, [previewFile]);

    // Cleanup and Initial Preview Handling
    useEffect(() => {
        if (!isOpen) {
            setPreviewFile(null);
            document.body.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'hidden';
            if (initialPreview) {
                handlePreview(initialPreview);
            }
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, initialPreview]);

    if (!isOpen) return null;

    const handlePreview = async (file) => {
        setLoading(true);
        try {
            // Securely fetch the file as a blob
            // Pass userId for Admin Role check
            const response = await API.get(`/file-preview/${file}?userId=${user.id}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = URL.createObjectURL(blob);

            const isPdf = file.toLowerCase().endsWith('.pdf');
            const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);
            const isDocx = file.toLowerCase().endsWith('.docx');

            let htmlContent = null;
            if (isDocx) {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                htmlContent = result.value;
            }

            setPreviewFile({ name: file, url, isPdf, isImage, isDocx, htmlContent });
        } catch (error) {
            console.error("Error fetching file:", error);
            addToast("Failed to load file. You may not have permission or the file does not exist.", 'error');
            // If initial preview failed, we should probably close or show list?
            // For now, let's just stay in list view if it fails, unless it was initial
            if (files.length === 1 || initialPreview) {
                // optional: onClose(); 
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        if (previewFile && previewFile.url) {
            URL.revokeObjectURL(previewFile.url);
        }
        setPreviewFile(null);
    };

    return (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(42, 49, 102, 0.95)' }}>
            <div className="modal-content" style={{
                padding: '0',
                width: previewFile ? '95%' : '600px',
                height: previewFile ? '95vh' : 'auto',
                maxWidth: '1400px',
                maxHeight: '95vh',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 30px',
                    borderBottom: '2px solid #2a3166',
                    background: '#2a3166',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {previewFile && !initialPreview && (
                            <button
                                onClick={handleBackToList}
                                className="btn-view-navy"
                                style={{
                                    padding: '6px 15px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    background: '#cae7df',
                                    color: '#2a3166'
                                }}
                            >
                                ← RETAKE
                            </button>
                        )}
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#cae7df', fontWeight: '800' }}>
                            {previewFile ? `PREVIEWING: ${previewFile.name.toUpperCase()}` : `VAULT: ${files.length} ATTACHMENTS`}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: '#ee7879',
                            border: '2px solid #2a3166',
                            color: '#2a3166',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
                            <div className="spinner" style={{ border: '4px solid #f4abaa', borderTop: '4px solid #2a3166' }}></div>
                            <span style={{ fontWeight: '800', letterSpacing: '2px', color: '#2a3166' }}>DECRYPTING SECURE MEDIA...</span>
                        </div>
                    ) : previewFile ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
                            {/* Preview Controls */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <a
                                    href={previewFile.url}
                                    download={previewFile.name}
                                    style={{
                                        background: '#2a3166',
                                        color: '#cae7df',
                                        textDecoration: 'none',
                                        padding: '10px 25px',
                                        borderRadius: '30px',
                                        fontSize: '0.9rem',
                                        fontWeight: '800',
                                        border: '2px solid #2a3166',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ⬇ EXPORT LOCAL
                                </a>
                            </div>

                            {/* Actual Preview */}
                            <div style={{
                                flex: 1, background: '#f4abaa', borderRadius: '15px',
                                overflow: 'hidden', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', border: '2px solid #2a3166'
                            }}>
                                {previewFile.isPdf ? (
                                    <iframe
                                        src={previewFile.url}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 'none' }}
                                        title="Secure PDF Port"
                                    />
                                ) : previewFile.isImage ? (
                                    <img
                                        src={previewFile.url}
                                        alt="Asset Preview"
                                        style={{ maxWidth: '98%', maxHeight: '98%', objectFit: 'contain', borderRadius: '5px' }}
                                    />
                                ) : previewFile.isDocx ? (
                                    <div
                                        style={{
                                            background: '#cae7df',
                                            color: '#2a3166',
                                            padding: '50px',
                                            overflowY: 'auto',
                                            width: '100%',
                                            height: '100%',
                                            fontFamily: "'Outfit', sans-serif",
                                            lineHeight: '1.8',
                                            fontSize: '1.1rem'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: previewFile.htmlContent }}
                                    />
                                ) : (
                                    <div style={{ color: '#2a3166', textAlign: 'center', padding: '40px' }}>
                                        <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>UNSUPPORTED PROTOCOL</p>
                                        <p>This media type requires local rendering.</p>
                                        <a href={previewFile.url} download={previewFile.name} style={{
                                            color: '#2a3166', background: '#ee7879',
                                            padding: '10px 20px', borderRadius: '8px',
                                            display: 'inline-block', marginTop: '20px', fontWeight: 'bold'
                                        }}>DOWNLOAD ASSET</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // File List View
                        <div style={{ overflowY: 'auto', maxHeight: '70vh', padding: '5px' }}>
                            {files.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <span style={{ fontSize: '4rem', opacity: 0.2 }}>📁</span>
                                    <p style={{ color: '#2a3166', fontWeight: '800', marginTop: '20px' }}>NO ASSETS REGISTERED</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                    {files.map((file, index) => {
                                        const isPdf = file.toLowerCase().endsWith('.pdf');
                                        const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);

                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '20px',
                                                background: '#f4abaa',
                                                borderRadius: '15px',
                                                border: '2px solid #2a3166',
                                                transition: 'transform 0.2s ease'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: '50px', height: '50px', background: '#2a3166',
                                                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', fontSize: '1.8rem'
                                                    }}>
                                                        {isPdf ? '📄' : (isImage ? '🖼️' : '📁')}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{
                                                            fontWeight: '800', color: '#2a3166',
                                                            whiteSpace: 'nowrap', overflow: 'hidden',
                                                            textOverflow: 'ellipsis', maxWidth: '350px'
                                                        }} title={file}>
                                                            {file}
                                                        </span>
                                                        <span style={{ fontSize: '0.85rem', color: '#2a3166', opacity: 0.7, fontWeight: '600' }}>
                                                            {isPdf ? 'PORTABLE DOCUMENT FORMAT' : (isImage ? 'IMAGE RASTER ASSET' : 'GENERIC DATA OBJECT')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button
                                                        onClick={() => handlePreview(file)}
                                                        className="btn-view-navy"
                                                        style={{ padding: '10px 25px', borderRadius: '25px', fontSize: '0.9rem' }}
                                                    >
                                                        {isPdf || isImage ? '👁 PREVIEW' : '⬇ EXPORT'}
                                                    </button>
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
