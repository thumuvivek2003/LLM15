export default function DocFilter({ docs, selected, onChange }) {
    return (
        <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Doc Filter (optional)</div>
            <div style={{ display: 'grid', gap: 6 }}>
                {docs.map(d => (
                    <label key={d._id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="checkbox" checked={selected.includes(d._id)} onChange={e => {
                            const next = e.target.checked ? [...selected, d._id] : selected.filter(x => x !== d._id);
                            onChange(next);
                        }} />
                        <span>{d.title}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}