export function redactForLLM(text) {
    const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const phoneRe = /\b(?:\+\d{1,3}[- ]?)?(?:\d{3}[- ]?){2}\d{4}\b/g; // simple
    const map = []; let idx = 0;
    let out = text.replace(emailRe, (m) => { const tag = `[EMAIL_${idx}]`; map.push({ tag, value: m }); idx++; return tag; });
    out = out.replace(phoneRe, (m) => { const tag = `[PHONE_${idx}]`; map.push({ tag, value: m }); idx++; return tag; });
    // (Optional) names/orgs via heuristics could be added here
    return { redacted: out, map };
}