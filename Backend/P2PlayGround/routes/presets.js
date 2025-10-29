import { Router } from 'express';
import Preset from '../models/Preset.js';


const r = Router();


// List with optional search by name/tag
r.get('/', async (req, res) => {
    const { q } = req.query;
    const filter = q
        ? { $or: [{ name: new RegExp(q, 'i') }, { tags: q }] }
        : {};
    const items = await Preset.find(filter).sort({ updatedAt: -1 }).limit(200);
    res.json(items);
});


// Read one
r.get('/:id', async (req, res) => {
    const item = await Preset.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
});


// Create
r.post('/', async (req, res) => {
    const body = req.body || {};
    const item = await Preset.create({
        name: body.name?.trim() || 'Untitled',
        systemPrompt: body.systemPrompt || '',
        userPrompt: body.userPrompt || '',
        model: body.model || 'gpt-4o-mini',
        temperature: Number(body.temperature ?? 0.7),
        top_p: Number(body.top_p ?? 1),
        tags: Array.isArray(body.tags) ? body.tags : [],
        notes: body.notes || ''
    });
    res.status(201).json(item);
});


// Update
r.put('/:id', async (req, res) => {
    const body = req.body || {};
    const item = await Preset.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                name: body.name,
                systemPrompt: body.systemPrompt,
                userPrompt: body.userPrompt,
                model: body.model,
                temperature: Number(body.temperature),
                top_p: Number(body.top_p),
                tags: body.tags,
                notes: body.notes
            }
        },
        { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
});


// Delete
r.delete('/:id', async (req, res) => {
    const out = await Preset.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
});


export default r;