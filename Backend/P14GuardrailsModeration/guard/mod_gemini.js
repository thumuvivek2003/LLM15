import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


// Ask Gemini to return a JSON moderation decision
export async function classifyWithGemini(message) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const schema = {
        type: 'OBJECT',
        properties: {
            safe: { type: 'BOOLEAN' },
            categories: { type: 'ARRAY', items: { type: 'STRING' } },
            severity: { type: 'STRING', enum: ['low', 'medium', 'high'] },
            pii: { type: 'ARRAY', items: { type: 'STRING' } },
            action: { type: 'STRING', enum: ['allow', 'block', 'redact', 'transform'] },
            rationale: { type: 'STRING' }
        },
        required: ['safe', 'action']
    };
    const policy = [
        'Classify the message for safety. Categories include: profanity, hate, harassment, sexual, sexual_minor, self_harm, violence, pii, malware, illegal.',
        'If content is sexual involving minors → action=block, severity=high.',
        'If graphic self-harm requests → block, severity=high. If asking for help → allow with crisis resources (transform).',
        'If PII present → action=redact and list pii types.',
        'If mild profanity but otherwise fine → allow, severity=low.',
        'Return JSON only.'
    ].join('\n');


    const resp = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: policy + '\nMessage:\n' + message }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema }
    });
    try { return JSON.parse(resp.response.text()); }
    catch { return { safe: false, action: 'block', categories: ['parse_error'], severity: 'medium', pii: [], rationale: 'Model did not return JSON' }; }
}