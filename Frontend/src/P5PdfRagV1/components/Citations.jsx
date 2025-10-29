export default function Citations({ citations }) {
    if (!citations?.length) return null;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Citations</div>
            {citations.map((c, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>[{i + 1}] {c.doc} — p.{c.page}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: 'pre-wrap' }}>{c.snippet}</div>
                </div>
            ))}
        </div>
    );
}