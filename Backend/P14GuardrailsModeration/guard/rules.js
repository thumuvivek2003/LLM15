// Deterministic, fast checks
export const PROFANITY = /\b(fuck|shit|bitch|bastard|asshole|retard|slut)\b/i;
export const HATE_HINT = /(kill all|exterminate|gas the|go back to where)/i;
export const SELF_HARM = /(kill myself|suicide|self harm|cutting myself)/i;
export const SEXUAL_MINOR = /(underage|young girl|young boy|child.*sex)/i;


export function basicRuleCheck(text) {
    const hits = [];
    if (PROFANITY.test(text)) hits.push('profanity');
    if (HATE_HINT.test(text)) hits.push('hate_or_violence');
    if (SELF_HARM.test(text)) hits.push('self_harm');
    if (SEXUAL_MINOR.test(text)) hits.push('sexual_minor');
    return hits;
}


// Simple sanitizer to remove hidden control chars / zero-width
export function sanitize(s) {
    return String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[\u0000-\u001F]/g, ' ');
}