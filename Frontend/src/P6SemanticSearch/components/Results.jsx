export default function Results({ results, total, page, size, onPage, onLabel }) {
    return (
        <div>
            <div style={{ fontSize: 12, opacity: 0.7, margin: '8px 0' }}>
                {total >= 0 ? `${total} results` : `${results.length + (page * size)}+ results`} · page {page + 1}
            </div>
            {results.map((r, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontWeight: 600 }}>{r.docTitle} — p.{r.page}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>score {r.score.toFixed(4)}</div>
                    </div>
                    <div style={{ fontSize: 14, marginTop: 4 }} dangerouslySetInnerHTML={{ __html: r.snippetHtml }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => onLabel?.(r, 'relevant')} style={{ padding: '6px 10px', border: '1px solid #0a0', borderRadius: 8 }}>Relevant</button>
                        <button onClick={() => onLabel?.(r, 'irrelevant')} style={{ padding: '6px 10px', border: '1px solid #a00', borderRadius: 8 }}>Irrelevant</button>
                    </div>
                </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Prev</button>
                <button onClick={() => onPage(page + 1)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Next</button>
            </div>
        </div>
    );
}