export default function SourcesPanel({ citations }) {
    if (!citations?.length) return (
        <div style={{ fontSize: 12, opacity: 0.6 }}>No sources yet</div>
    );
    return (
        <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Sources</div>
            {citations.map((c, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>[{i + 1}] {c.doc} — p.{c.page}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: 'pre-wrap' }}>{c.snippet}</div>
                </div>
            ))}
        </div>
    );
}