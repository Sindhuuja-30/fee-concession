/**
 * Smart Eligibility Scoring System
 * Calculates priority score based on multiple factors
 */

/**
 * Calculate eligibility score for a fee concession application
 * @param {Object} application - Application data
 * @returns {Object} - { score: number, priorityLevel: string, recommendedRate: number }
 */
function calculateEligibilityScore(application) {
    let score = 0;

    // ---------------------------------------------------------
    // A. Family Income (Maximum: 50 Points)
    // ---------------------------------------------------------
    const incomeStr = application.income || '';
    let incomePoints = 0;

    // Normalize income string to check ranges
    // Assuming dropdown values: "Below 1 Lakh", "1 Lakh - 3 Lakhs", "3 Lakhs - 5 Lakhs", "Above 5 Lakhs"
    if (incomeStr.includes('Below 1 Lakh')) {
        incomePoints = 50;
    } else if (incomeStr.includes('1 Lakh - 3 Lakhs')) {
        incomePoints = 40;
    } else if (incomeStr.includes('3 Lakhs - 5 Lakhs')) {
        incomePoints = 25;
    } else if (incomeStr.includes('Above 5 Lakhs')) {
        incomePoints = 10;
    }
    score += incomePoints;

    // ---------------------------------------------------------
    // B. Academic Performance (Maximum: 20 Points)
    // ---------------------------------------------------------
    const cgpa = parseFloat(application.cgpa) || 0;
    let academicPoints = 0;

    if (cgpa >= 9.0) {
        academicPoints = 20;
    } else if (cgpa >= 8.0) {
        academicPoints = 15;
    } else if (cgpa >= 7.0) {
        academicPoints = 10;
    } else {
        academicPoints = 5; // < 7.0
    }

    // Penalty: If backlog exists, set academic points to 0
    if (application.prevSemResult === 'Backlog') {
        academicPoints = 0;
    }
    score += academicPoints;

    // ---------------------------------------------------------
    // C. Special Conditions (Maximum: 15 Points)
    // ---------------------------------------------------------
    let specialPoints = 0;
    const specialConditions = application.specialConditions || [];

    if (specialConditions.includes('Orphan')) specialPoints += 10;
    if (specialConditions.includes('Disability')) specialPoints += 10;
    if (specialConditions.includes('Single Parent')) specialPoints += 5;
    if (specialConditions.includes('Farmer Background')) specialPoints += 5;

    // Cap at 15 points
    score += Math.min(specialPoints, 15);

    // ---------------------------------------------------------
    // D. Category (Maximum: 15 Points)
    // ---------------------------------------------------------
    let categoryPoints = 0;
    const category = application.category || '';

    if (category === 'SC' || category === 'ST') {
        categoryPoints = 15;
    } else if (category === 'OBC') {
        categoryPoints = 10;
    } else if (category === 'General') {
        categoryPoints = 5;
    } else {
        // Others or unspecified
        categoryPoints = 5;
    }
    score += Math.min(categoryPoints, 15);

    // Ensure score is within 0-100 range
    score = Math.min(Math.max(score, 0), 100);

    // ---------------------------------------------------------
    // Priority Level & Concession Rate Mapping
    // ---------------------------------------------------------
    let priorityLevel;
    let recommendedRate;

    if (score >= 80) {
        priorityLevel = 'High';
        recommendedRate = 80;
    } else if (score >= 60) {
        priorityLevel = 'Medium';
        recommendedRate = 60;
    } else if (score >= 40) {
        priorityLevel = 'Low';
        recommendedRate = 40;
    } else {
        priorityLevel = 'Low';
        recommendedRate = 20; // Below 40 score
    }

    return {
        score: Math.round(score),
        priorityLevel,
        recommendedRate
    };
}

module.exports = { calculateEligibilityScore };
