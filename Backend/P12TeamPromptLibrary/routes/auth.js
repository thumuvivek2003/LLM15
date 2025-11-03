import { Router } from 'express';
import Org from '../models/Org.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import { hashPassword, verifyPassword, sign } from '../auth.js';


const r = Router();


r.post('/register', async (req, res) => {
    const { orgName, email, name, password } = req.body || {};
    if (!orgName || !email || !password) return res.status(400).json({ error: 'orgName, email, password required' });
    const org = await Org.create({ name: orgName });
    const user = await User.create({ email, name, passwordHash: await hashPassword(password) });
    await Membership.create({ orgId: org._id, userId: user._id, role: 'owner' });
    const token = sign(user);
    res.cookie(process.env.COOKIE_NAME || 'pl_auth', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true, orgId: org._id, user: { id: user._id, email: user.email, name: user.name } });
});


r.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: 'invalid' });
    const token = sign(user);
    res.cookie(process.env.COOKIE_NAME || 'pl_auth', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true, user: { id: user._id, email: user.email, name: user.name } });
});


r.post('/logout', async (_req, res) => { res.clearCookie(process.env.COOKIE_NAME || 'pl_auth'); res.json({ ok: true }); });


export default r;