import { useCallback, useState } from 'react';


export default function DropZone({ onFile }) {
    const [hover, setHover] = useState(false);
    const onDrop = useCallback((e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
    }, [onFile]);
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={onDrop}
            style={{
                padding: 24,
                border: '2px dashed #ccc',
                borderRadius: 12,
                textAlign: 'center',
                background: hover ? '#f8f8ff' : 'transparent'
            }}
        >
            <div style={{ marginBottom: 8 }}>Drag & drop .md/.txt here</div>
            <div>or</div>
            <label style={{ display: 'inline-block', marginTop: 8 }}>
                <input type="file" accept=".md,.markdown,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
                <span style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>Choose file</span>
            </label>
        </div>
    );
}