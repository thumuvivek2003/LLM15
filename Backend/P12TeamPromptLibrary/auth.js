import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Membership from './models/Membership.js';


export async function hashPassword(p) { return bcrypt.hash(p, 10); }
export async function verifyPassword(p, h) { return bcrypt.compare(p, h); }


export function sign(user) {
    const payload = { uid: user._id, email: user.email };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}


export async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.[process.env.COOKIE_NAME || 'pl_auth'] || (req.headers.authorization || '').replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; next();
    } catch { return res.status(401).json({ error: 'invalid token' }); }
}


export async function requireRole(orgId, userId, allowed) {
    const m = await Membership.findOne({ orgId, userId });
    if (!m) return false;
    const order = ['viewer', 'editor', 'admin', 'owner'];
    return allowed.some(r => order.indexOf(m.role) >= order.indexOf(r));
}