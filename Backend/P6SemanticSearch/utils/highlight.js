// Minimal safe highlight: escape HTML, then wrap query terms in <mark>
export function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c])); }


export function bestSnippet(text, query, window = 320) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return escapeHtml(text.slice(0, window));
    const terms = q.split(/\s+/).filter(Boolean);
    const lower = text.toLowerCase();
    let bestIdx = 0, bestScore = -1;
    for (let i = 0; i < lower.length; i += Math.floor(window / 2)) {
        const seg = lower.slice(i, i + window);
        const score = terms.reduce((acc, t) => acc + (seg.includes(t) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    const start = Math.max(0, bestIdx - 40), end = Math.min(text.length, bestIdx + window + 40);
    return escapeHtml(text.slice(start, end));
}


export function addMarks(htmlEscaped, query) {
    const terms = (query || '').toLowerCase().split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length).slice(0, 6);
    let out = htmlEscaped;
    for (const t of terms) {
        const re = new RegExp(`(${t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        out = out.replace(re, '<mark>$1</mark>');
    }
    return out;
}