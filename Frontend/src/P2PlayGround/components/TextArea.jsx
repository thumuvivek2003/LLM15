export default function TextArea({ label, value, onChange, rows = 6, placeholder }) {
    return (
        <label style={{ display: 'block', marginBottom: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{label}</div>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
                placeholder={placeholder}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'monospace' }} />
        </label>
    );
}