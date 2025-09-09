import jwt from 'jsonwebtoken';
import authCookieOptions from '../utils/cookieOptions.js';

export const verifyToken = (req, res, next) => {
    const token = req.cookies?.jwt;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Attach userId to request object
        // Sliding session: refresh cookie expiration on each valid request
        try {
            res.cookie('jwt', token, authCookieOptions());
        } catch (_) { /* ignore refresh errors */ }
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
}