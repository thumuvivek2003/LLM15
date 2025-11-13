import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { job } from '../api';


const socket = io('http://localhost:5000');


export default function Progress({ jobId }) {
    const [events, setEvents] = useState([]);
    const [state, setState] = useState('queued');
    const [result, setResult] = useState(null);


    useEffect(() => {
        const onMsg = (ev) => {
            if (ev.jobId !== jobId) return;
            setEvents(prev => [...prev, ev]);
            if (ev.type === 'complete') setResult(ev.result);
        };
        socket.on('progress', onMsg);
        return () => { socket.off('progress', onMsg); };
    }, [jobId]);


    useEffect(() => { (async () => { try { const j = await job(jobId); setState(j.state); setResult(j.result || null); } catch { } })(); }, [jobId]);


    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Job</strong> <code>{jobId}</code>
                <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>state: {state}</span>
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {events.map((e, i) => (
                    <div key={i} style={{ fontSize: 14 }}>
                        <span style={{ opacity: 0.6 }}>#{i + 1}</span> <b>{e.type}</b> {e.label ? `· ${e.label}` : ''}
                        {e.error && <span style={{ color: '#a00' }}> — {e.error}</span>}
                        {e.data && <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: 8 }}>{typeof e.data === 'string' ? e.data : JSON.stringify(e.data, null, 2)}</pre>}
                    </div>
                ))}
            </div>
            {result && (
                <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>
                    <div style={{ fontWeight: 700 }}>Result</div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}