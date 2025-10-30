export default function EvalPanel({ labels, size }) {
    const arr = Object.values(labels || {});
    const k = Math.max(1, size || 10);
    const relFlags = arr.map(x => x === 'relevant');
    const relAtK = relFlags.slice(0, k);
    const precisionAtK = relAtK.length ? (relAtK.filter(Boolean).length / relAtK.length) : 0;
    const mrr = relFlags.length ? (1 / (relFlags.findIndex(Boolean) + 1 || Infinity)) : 0;
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Eval (manual labels)</div>
            <div style={{ fontSize: 14 }}>Precision@{k}: <b>{precisionAtK.toFixed(2)}</b></div>
            <div style={{ fontSize: 14 }}>MRR: <b>{isFinite(mrr) ? mrr.toFixed(2) : '0.00'}</b></div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Click Relevant/Irrelevant on results to populate these stats.</div>
        </div>
    );
}