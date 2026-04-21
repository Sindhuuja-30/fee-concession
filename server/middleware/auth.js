const User = require('../models/User');

/**
 * Middleware to authenticate user
 * Validates that userId is provided and user exists
 */
async function authenticateUser(req, res, next) {
    try {
        const userId = (req.body?.userId) || (req.body?.adminId) || (req.body?.studentId) || req.query.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required: User ID missing' });
        }

        // Check Database Connectivity
        if (mongoose.connection.readyState !== 1) {
            console.error('[AUTH_ERROR] DB disconnected. readyState:', mongoose.connection.readyState);
            return res.status(503).json({ 
                error: 'Service Unavailable: Database connection is down.',
                details: 'Please try again in a few moments.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'Authentication failed: User not found' });
        }

        // Attach user to request object for downstream use
        req.user = user;
        next();
    } catch (error) {
        console.error('[AUTH_ERROR]:', error);
        return res.status(500).json({ 
            error: 'Authentication error',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
}

/**
 * Higher-order middleware to require specific role
 * @param {string} requiredRole - 'admin' or 'student'
 * @returns {Function} Express middleware function
 */
function requireRole(requiredRole) {
    return async (req, res, next) => {
        try {
            // First authenticate if not already done
            if (!req.user) {
                await authenticateUser(req, res, () => { });
                if (!req.user) {
                    // authenticateUser already sent response
                    return;
                }
            }

            if (req.user.role !== requiredRole) {
                return res.status(403).json({
                    error: `Forbidden: ${requiredRole} access required`,
                    message: `You do not have permission to access this resource. Required role: ${requiredRole}`
                });
            }

            next();
        } catch (error) {
            console.error('[ROLE CHECK ERROR]', error);
            return res.status(500).json({ error: 'Authorization error' });
        }
    };
}

/**
 * Simplified role check for routes that already have userId in params/body
 * @param {string} requiredRole - 'admin' or 'student'
 */
function checkRole(requiredRole) {
    return async (req, res, next) => {
        try {
            const userId = (req.body?.userId) || (req.body?.adminId) || (req.body?.studentId) || req.query.userId || req.params.userId;

            if (!userId) {
                return res.status(401).json({ error: 'User ID required for authorization' });
            }

            // Check Database Connectivity
            if (mongoose.connection.readyState !== 1) {
                console.error('[AUTH_ERROR] DB disconnected. readyState:', mongoose.connection.readyState);
                return res.status(503).json({ 
                    error: 'Service Unavailable: Database connection is down'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (user.role !== requiredRole) {
                return res.status(403).json({
                    error: `Forbidden: ${requiredRole} access required`,
                    message: `You do not have permission to perform this action.`
                });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('[ROLE_CHECK_ERROR]:', error);
            return res.status(500).json({ 
                error: 'Authorization error',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    };
}

module.exports = {
    authenticateUser,
    requireRole,
    checkRole
};
