/**
 * Scheme-Based Eligibility and Concession Calculation Utility
 * Pure functions — no database calls.
 */

// Minority religion categories recognized for Minority Scholarship
const MINORITY_RELIGIONS = ['Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Zoroastrian'];

// Income thresholds for Government Scholarship (Family Annual Income)
// income field values as stored by the application
const GOVT_INCOME_THRESHOLD = 'Below 1 Lakh'; // eligible category
const GOVT_INCOME_ALSO_ELIGIBLE = '1 Lakh - 3 Lakhs'; // also eligible

// Sports certificate point map
const SPORTS_POINTS = {
    'Zone': 3,
    'District': 5,
    'State': 10,
    'National': 15,
    'International': 20
};

/**
 * Government Scholarship Eligibility
 * @param {string|number} income - Income string (dropdown) or number (raw amount)
 * @returns {{ eligible: boolean, concessionPercentage: number, reason: string }}
 */
function calculateGovernmentScholarshipEligibility(income) {
    // 1. Handle numeric income (priority)
    const incomeValue = typeof income === 'number' ? income : parseFloat(income);

    if (!isNaN(incomeValue) && typeof income !== 'string') {
        if (incomeValue < 100000) {
            return { eligible: true, concessionPercentage: 75, reason: 'Annual income below 1 Lakh — 75% scholarship eligible' };
        } else if (incomeValue <= 300000) {
            return { eligible: true, concessionPercentage: 50, reason: 'Annual income between 1–3 Lakhs — 50% scholarship eligible' };
        } else {
            return { eligible: false, concessionPercentage: 0, reason: 'Annual income exceeds 3 Lakhs threshold for Government Scholarship' };
        }
    }

    // 2. Fallback to string-based (legacy/dropdown)
    const incomeStr = (income || '').toString().trim();

    if (incomeStr.includes('Below 1 Lakh')) {
        return { eligible: true, concessionPercentage: 75, reason: 'Income category: Below 1 Lakh — 75% scholarship eligible' };
    } else if (incomeStr.includes('1 Lakh - 3 Lakhs')) {
        return { eligible: true, concessionPercentage: 50, reason: 'Income category: 1 Lakh - 3 Lakhs — 50% scholarship eligible' };
    } else {
        return { eligible: false, concessionPercentage: 0, reason: 'Income exceeds Government Scholarship threshold' };
    }
}

/**
 * Minority Scholarship Eligibility
 * @param {string} religion - Religion string submitted by student
 * @returns {{ eligible: boolean, concessionPercentage: number, reason: string }}
 */
function calculateMinorityScholarshipEligibility(religion) {
    const rel = (religion || '').trim();

    const isMinority = MINORITY_RELIGIONS.some(r => r.toLowerCase() === rel.toLowerCase());

    if (isMinority) {
        return { eligible: true, concessionPercentage: 50, reason: `Religion "${rel}" qualifies as a minority category` };
    } else {
        return { eligible: false, concessionPercentage: 0, reason: `Religion "${rel}" does not match any recognized minority category` };
    }
}

/**
 * Sports Quota — Point Calculation and Concession Mapping
 * @param {Array<{level: string}>} certificates - Array of certificate objects with level
 * @returns {{ totalPoints: number, concessionPercentage: number, breakdown: Array }}
 */
function calculateSportsQuotaConcession(certificates) {
    if (!certificates || certificates.length === 0) {
        return { totalPoints: 0, concessionPercentage: 0, breakdown: [] };
    }

    let totalPoints = 0;
    const breakdown = [];

    for (const cert of certificates) {
        const level = (cert.level || '').trim();
        const points = SPORTS_POINTS[level] || 0;
        totalPoints += points;
        breakdown.push({ level, points });
    }

    let concessionPercentage = 0;
    if (totalPoints >= 1 && totalPoints <= 5) {
        concessionPercentage = 5;
    } else if (totalPoints >= 6 && totalPoints <= 10) {
        concessionPercentage = 10;
    } else if (totalPoints >= 11 && totalPoints <= 20) {
        concessionPercentage = 20;
    } else if (totalPoints >= 21 && totalPoints <= 30) {
        concessionPercentage = 30;
    } else if (totalPoints > 30) {
        concessionPercentage = 40;
    }

    return { totalPoints, concessionPercentage, breakdown };
}

/**
 * Merit Scholarship Eligibility
 * @param {number} marksPercentage - Student's marks percentage
 * @returns {{ eligible: boolean, concessionPercentage: number, reason: string }}
 */
function calculateMeritScholarshipEligibility(marksPercentage) {
    const marks = parseFloat(marksPercentage) || 0;

    if (marks >= 90) {
        return { eligible: true, concessionPercentage: 50, reason: 'Marks ≥ 90% — 50% fee concession' };
    } else if (marks >= 80) {
        return { eligible: true, concessionPercentage: 30, reason: 'Marks 80–89% — 30% fee concession' };
    } else if (marks >= 70) {
        return { eligible: true, concessionPercentage: 15, reason: 'Marks 70–79% — 15% fee concession' };
    } else {
        return { eligible: false, concessionPercentage: 0, reason: 'Marks below 70% — not eligible for Merit Scholarship' };
    }
}

/**
 * Master scheme eligibility dispatcher
 * @param {string} scheme - Selected scheme name
 * @param {Object} data - Application data
 * @returns {{ eligible: boolean, concessionPercentage: number, sportsPoints: number, reason: string }}
 */
function evaluateSchemeEligibility(scheme, data) {
    switch (scheme) {
        case 'Government Scholarship': {
            // If income is missing but certificate is provided, mark as eligible with 0% (pending admin check)
            if (!data.income && data.hasIncomeCert) {
                return {
                    eligible: true,
                    concessionPercentage: 0,
                    sportsPoints: 0,
                    reason: 'Income Certificate uploaded — awaiting manual verification of income limit'
                };
            }
            const result = calculateGovernmentScholarshipEligibility(data.income);
            return { ...result, sportsPoints: 0 };
        }
        case 'Minority Scholarship': {
            const result = calculateMinorityScholarshipEligibility(data.religion);
            return { ...result, sportsPoints: 0 };
        }
        case 'Sports Quota': {
            const sportsResult = calculateSportsQuotaConcession(data.sportsCertificates || []);
            return {
                eligible: sportsResult.totalPoints > 0,
                concessionPercentage: sportsResult.concessionPercentage,
                sportsPoints: sportsResult.totalPoints,
                reason: `Sports certificates total: ${sportsResult.totalPoints} points → ${sportsResult.concessionPercentage}% concession`
            };
        }
        case 'Merit Scholarship': {
            const result = calculateMeritScholarshipEligibility(data.marksPercentage);
            return { ...result, sportsPoints: 0 };
        }
        default:
            return { eligible: false, concessionPercentage: 0, sportsPoints: 0, reason: 'Unknown scheme' };
    }
}

module.exports = {
    evaluateSchemeEligibility,
    calculateGovernmentScholarshipEligibility,
    calculateMinorityScholarshipEligibility,
    calculateSportsQuotaConcession,
    calculateMeritScholarshipEligibility,
    SPORTS_POINTS,
    MINORITY_RELIGIONS
};
