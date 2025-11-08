export function estimateTokens(s) { return Math.ceil(String(s || '').length / 4); }
export function clampBudget(msgs, budget) {
    // take from the end until budget fits
    const out = []; let used = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i]; const t = m.tokenGuess || estimateTokens(m.content);
        if (used + t > budget) break;
        out.push(m); used += t;
    }
    return { context: out.reverse(), used };
}