import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import { allow } from '../rbac.js';
import { audit } from '../audit.js';
import Prompt from '../models/Prompt.js';
import PromptVersion from '../models/PromptVersion.js';
import Approval from '../models/Approval.js';
import { GoogleGenerativeAI } from '@google/generative-ai';



const r = Router();
r.use(authMiddleware);


// List/search
r.get('/', async (req, res) => {
    const { orgId, q = '' } = req.query; if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const filter = { orgId, ...(q ? { $or: [{ title: new RegExp(q, 'i') }, { tags: q }] } : {}) };
    const items = await Prompt.find(filter).sort({ updatedAt: -1 }).limit(200);
    res.json(items);
});


// Create prompt (editor+)
r.post('/', allow(['editor', 'admin', 'owner']), async (req, res) => {
    const { title, folder = '/', tags = [], variables = [] } = req.body || {};
    const p = await Prompt.create({ orgId: req.orgId, title, folder, tags, variables, status: 'draft' });
    await audit({ orgId: req.orgId, userId: req.user.uid, action: 'create', entity: 'Prompt', entityId: String(p._id), data: { title } });
    res.json(p);
});

// Create new version
r.post('/:id/versions', allow(['editor', 'admin', 'owner']), async (req, res) => {
    const prompt = await Prompt.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!prompt) return res.status(404).json({ error: 'not found' });
    const latest = await PromptVersion.find({ promptId: prompt._id }).sort({ number: -1 }).limit(1);
    const nextNum = (latest[0]?.number || 0) + 1;
    const { body, notes = '' } = req.body || {};
    const v = await PromptVersion.create({ promptId: prompt._id, number: nextNum, body, notes, createdBy: req.user.uid, state: 'draft' });
    await audit({ orgId: req.orgId, userId: req.user.uid, action: 'version.create', entity: 'PromptVersion', entityId: String(v._id), data: { number: nextNum } });
    res.json(v);
});



// Submit for approval
r.post('/versions/:vid/submit', allow(['editor', 'admin', 'owner']), async (req, res) => {
    console.log(req.orgId);
    const v = await PromptVersion.findById(req.params.vid).populate('promptId');
    if (!v || String(v.promptId.orgId) !== String(req.orgId)) return res.status(404).json({ error: 'not found' });
    v.state = 'pending'; await v.save();
    await Prompt.updateOne({ _id: v.promptId._id }, { $set: { status: 'pending' } });
    await audit({ orgId: req.orgId, userId: req.user.uid, action: 'version.submit', entity: 'PromptVersion', entityId: String(v._id) });
    res.json({ ok: true });
});


// Approve or reject (admin+)
r.post('/versions/:vid/decision', allow(['admin', 'owner']), async (req, res) => {
    const { decision, comment = '' } = req.body || {}; // 'approved' | 'rejected'
    const v = await PromptVersion.findById(req.params.vid).populate('promptId');
    if (!v || String(v.promptId.orgId) !== String(req.orgId)) return res.status(404).json({ error: 'not found' });
    if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'bad decision' });
    await Approval.create({ versionId: v._id, reviewerId: req.user.uid, decision, comment });
    if (decision === 'approved') {
        v.state = 'approved'; v.approvedBy = req.user.uid; v.approvedAt = new Date(); await v.save();
        await Prompt.updateOne({ _id: v.promptId._id }, { $set: { currentVersionId: v._id, status: 'published' } });
    } else {
        v.state = 'rejected'; await v.save();
        await Prompt.updateOne({ _id: v.promptId._id }, { $set: { status: 'rejected' } });
    }
    await audit({ orgId: req.orgId, userId: req.user.uid, action: `version.${decision}`, entity: 'PromptVersion', entityId: String(v._id), data: { comment } });
    res.json({ ok: true });
});


// Get versions list
r.get('/:id/versions', async (req, res) => {
    const prompt = await Prompt.findOne({ _id: req.params.id, orgId: req.query.orgId || req.orgId });
    if (!prompt) return res.status(404).json({ error: 'not found' });
    const versions = await PromptVersion.find({ promptId: prompt._id }).sort({ number: -1 });
    res.json(versions);
});


// Preview with Gemini (server-side only)
r.post('/preview', allow(['viewer', 'editor', 'admin', 'owner']), async (req, res) => {
    try {
        const { body, vars = {} } = req.body || {};
        const filled = String(body || '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const resp = await model.generateContent(filled);
        res.json({ ok: true, preview: resp.response.text() });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


// Simple audit log fetch (admin+)
r.get('/audit/list', allow(['admin', 'owner']), async (req, res) => {
    console.log(req.query);
    const { orgId } = req.query; if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const logs = await (await import('../models/AuditLog.js')).default.find({ orgId }).sort({ createdAt: -1 }).limit(200);
    res.json(logs);
});


export default r;