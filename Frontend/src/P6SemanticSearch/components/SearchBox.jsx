import { useState } from 'react';
export default function SearchBox({ onSearch }) {
    const [q, setQ] = useState(''); const [size, setSize] = useState(10);
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 8 }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your docs semantically…" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            <label>Page size
                <input type="number" min={5} max={50} value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
            </label>
            <button onClick={() => onSearch(q, 0, size)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Search</button>
        </div>
    );
}