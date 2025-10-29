export default function PresetList({ items, onSelect, onDelete }) {
    return (
        <div style={{ display: 'grid', gap: 6 }}>
            {items.map(p => (
                <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{p.model} · t={p.temperature} · p={p.top_p}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button onClick={() => onSelect(p)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd' }}>Load</button>
                        <button onClick={() => onDelete(p._id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #f3c' }}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
            {items.length === 0 && <div style={{ opacity: 0.6 }}>No presets yet</div>}
        </div>
    );
}