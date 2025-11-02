export function buildPrompt({ tone, length, bullets, sourceText, sender, rewriteSubject }) {
    const style = tone === 'formal' ? 'Use a professional, concise tone.' : tone === 'friendly' ? 'Use a warm, friendly tone.' : 'Use a clear, neutral tone.';
    const len = length === 'short' ? 'Write 3-5 sentences maximum.' : length === 'long' ? 'Write 6-10 sentences with detail.' : 'Write ~4-6 sentences.';
    const extras = [bullets ? 'If appropriate, format key points as a short bulleted list.' : '', 'Do not invent facts. If info is missing, propose next steps or questions.'].join('\n');


    const fewshot = `You reply to emails succinctly. Keep salutations and sign-offs tidy. Avoid exposing placeholders like [EMAIL_0]. If there are placeholders, treat them as sensitive data and do not echo them unless necessary (e.g., To: field).`;


    const subjectLine = rewriteSubject ? 'Propose a subject line starting with "Subject:" only if the existing subject is unclear.' : 'Do not propose a new subject line.';


    return [
        fewshot,
        style,
        len,
        subjectLine,
        extras,
        '\n--- EMAIL START ---\n',
        sourceText,
        '\n--- EMAIL END ---\n',
        `Write a reply addressed to ${sender}. Start with a short greeting using the recipient's first name if available.`
    ].join('\n');
}


export function postProcess({ draft, map, addDisclaimer, signature }) {
    let out = draft.trim();
    // Never reinsert raw PII in the body that model intentionally avoided.
    // Only reinsert for explicit fields the UI will collect (To:), not inside generated text.
    // Here we leave placeholders as-is inside the body for demo safety.


    if (signature) {
        out += `\n\n${signature.trim()}`;
    }
    if (addDisclaimer) {
        out += `\n\n—\nDraft generated with AI. Please review for accuracy & sensitive info before sending.`;
    }
    return out;
}