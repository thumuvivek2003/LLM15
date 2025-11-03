import { useEffect, useState } from 'react';
import { audits } from '../api';
export default function Audit({ orgId }) {
    const [rows, setRows] = useState([]);
    useEffect(() => { (async () => setRows(await audits(orgId)))(); }, [orgId]);
    return (
        <div>
            <h3>Audit Log</h3>
            {rows.map(r => (
                <div key={r._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(r.createdAt).toLocaleString()} — {r.action}</div>
                    <div style={{ fontSize: 12 }}>entity: {r.entity}#{r.entityId}</div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.data || {}, null, 2)}</pre>
                </div>
            ))}
        </div>
    );
}