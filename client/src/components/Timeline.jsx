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
                    height: '2px',
                    background: 'rgba(255,255,255,0.2)',
                    zIndex: 0
                }}>
                    <div style={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                        height: '100%',
                        background: isRejected ? '#ff1744' : '#00e676',
                        transition: 'width 0.5s ease'
                    }} />
                </div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    let circleColor = 'rgba(255,255,255,0.1)';
                    if (isCompleted) circleColor = '#00e676';
                    if (isRejected && isCurrent) circleColor = '#ff1744';

                    return (
                        <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: circleColor,
                                border: `2px solid ${isCompleted ? (isRejected && isCurrent ? '#ff1744' : '#00e676') : 'rgba(255,255,255,0.3)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px',
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {index + 1}
                            </div>
                            <div style={{
                                color: isCompleted ? 'white' : 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem'
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
