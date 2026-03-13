function Timeline({ status }) {
    const steps = ['Submitted', 'Pending', 'Approved'];

    // Map status to step index
    let currentStep = 0;
    if (status === 'Pending') currentStep = 1;
    if (status === 'Approved') currentStep = 2;
    if (status === 'Rejected') currentStep = 2; // Rejected also completes the process

    const isRejected = status === 'Rejected';

    return (
        <div className="timeline-container" style={{ margin: '20px 0', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {/* Progress Bar Line */}
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'rgba(42, 49, 102, 0.1)',
                    zIndex: 0,
                    borderRadius: '2px'
                }}>
                    <div style={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                        height: '100%',
                        background: isRejected ? 'var(--accent)' : 'var(--mint)',
                        border: '1px solid var(--primary)',
                        transition: 'width 0.5s ease',
                        borderRadius: '2px'
                    }} />
                </div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    let circleColor = 'var(--bg-soft)';
                    let borderColor = 'rgba(42, 49, 102, 0.2)';
                    if (isCompleted) {
                        circleColor = 'var(--mint)';
                        borderColor = 'var(--primary)';
                    }
                    if (isRejected && isCurrent) {
                        circleColor = 'var(--accent)';
                        borderColor = 'var(--primary)';
                    }

                    return (
                        <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: circleColor,
                                border: `2px solid ${borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px',
                                color: 'var(--primary)',
                                fontWeight: '900',
                                boxShadow: isCompleted ? '0 0 10px rgba(42, 49, 102, 0.2)' : 'none'
                            }}>
                                {index + 1}
                            </div>
                            <div style={{
                                color: isCompleted ? 'var(--primary)' : 'rgba(42, 49, 102, 0.5)',
                                fontSize: '0.85rem',
                                fontWeight: '700'
                            }}>
                                {step === 'Approved' && isRejected ? 'Decision' : step}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Timeline;
