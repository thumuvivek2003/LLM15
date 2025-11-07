import crypto from 'crypto';
import Incident from '../models/Incident.js';
import { sanitize } from './rules.js';
import { detectPII, redactPII } from './pii.js';
import { basicRuleCheck } from './rules.js';
import { classifyWithGemini } from './mod_gemini.js';


export function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex'); }


export async function preModerate(text) {
    const clean = sanitize(text);
    const hits = basicRuleCheck(clean);
    const pii = detectPII(clean);
    if (pii.length) hits.push('pii');
    if (hits.includes('sexual_minor') || hits.includes('self_harm')) {
        return { action: 'block', categories: hits, severity: 'high', text: clean };
    }
    // Delegate nuanced cases to Gemini
    const llm = await classifyWithGemini(clean);
    let outText = clean;
    if (llm.action === 'redact' || pii.length) { outText = redactPII(outText); }
    return { action: llm.action, categories: [...new Set([...hits, ...(llm.categories || [])])], severity: llm.severity || 'low', text: outText, pii: [...pii, ...(llm.pii || [])] };
}


export async function postModerate(text) {
    // Post-check the model output similarly
    const clean = sanitize(text);
    const pii = detectPII(clean);
    const llm = await classifyWithGemini(clean);
    let out = clean;
    let action = llm.action;
    if (action === 'allow' && pii.length) action = 'redact';
    if (action === 'redact') out = redactPII(out);
    return { action, categories: llm.categories || [], severity: llm.severity || 'low', text: out, pii: [...pii, ...(llm.pii || [])] };
}


export async function logIncident({ stage, action, categories, severity, original, details }) {
    try {
        await Incident.create({ stage, action, category: categories, severity, messageHash: sha1(original), messagePreview: original.slice(0, 140), model: 'gemini-2.0-flash', details });
    } catch { }
}