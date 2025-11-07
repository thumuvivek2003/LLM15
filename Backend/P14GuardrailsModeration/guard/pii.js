// Lightweight PII patterns (expand as needed)
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\b(?:\+\d{1,3}[ -]?)?(?:\d{3}[ -]?){2}\d{4}\b/g;
const CREDIT = /\b(?:\d[ -]*?){13,19}\b/g; // naive


export function detectPII(text) {
    const m = [];
    if (EMAIL.test(text)) m.push('email');
    if (PHONE.test(text)) m.push('phone');
    if (CREDIT.test(text)) m.push('credit_card_like');
    return m;
}


export function redactPII(text) {
    return text
        .replace(EMAIL, '[EMAIL]')
        .replace(PHONE, '[PHONE]')
        .replace(CREDIT, '[CARD]');
}