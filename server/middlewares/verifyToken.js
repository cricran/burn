import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    console.log('Verifying token...');
    const token = req.cookies.jwt;
    console.log(!token)
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Attach userId to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
}