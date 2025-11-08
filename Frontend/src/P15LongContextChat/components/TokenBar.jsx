export default function TokenBar({ used = 0, budget = 10 }) {
    const pct = Math.min(100, Math.round((used / budget) * 100));
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Context budget: {used}/{budget} (~tokens)</div>
            <div style={{ height: 8, background: '#f3f3f3', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? '#c62828' : pct > 65 ? '#f9a825' : '#43a047' }} />
            </div>
        </div>
    );
}