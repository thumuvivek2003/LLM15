function dcg(scores) { let v = 0; for (let i = 0; i < scores.length; i++) { const rel = scores[i]; const denom = Math.log2(i + 2); v += (Math.pow(2, rel) - 1) / denom; } return v; }
export function ndcgAtK({ goldIds, ranked, k = 10 }) {
    const idcg = dcg(goldIds.slice(0, k).map(() => 3)); // ideal: all relevant at top with rel=3
    const rels = ranked.slice(0, k).map(r => goldIds.includes(String(r._id)) ? 3 : 0);
    const val = idcg ? (dcg(rels) / idcg) : 0; return Number(val.toFixed(4));
}
export function recallAtK({ goldIds, ranked, k = 10 }) {
    const set = new Set(goldIds.map(String));
    const got = new Set(ranked.slice(0, k).map(r => String(r._id)).filter(id => set.has(id)));
    return Number((got.size / Math.max(1, set.size)).toFixed(4));
}