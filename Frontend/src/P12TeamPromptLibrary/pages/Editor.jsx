import { useEffect, useState } from 'react';
import { versions, createVersion, submitVersion, preview } from '../api';
import { useCallback } from 'react';


export default function Editor({ orgId, prompt, onBack }) {
    const [vs, setVs] = useState([]);
    const [body, setBody] = useState('');
    const [vars, setVars] = useState('name=Riya\nproduct=Road Bike');
    const [msg, setMsg] = useState('');
    const [out, setOut] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const sortVersionsDesc = useCallback((list) => {
        return [...list].sort((a, b) => {
            const byNum = (b.number ?? 0) - (a.number ?? 0);
            if (byNum !== 0) return byNum;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, []);


    const load = useCallback(async () => {
        try {
            const list = await versions(prompt._id, orgId);
            const sorted = sortVersionsDesc(list);
            setVs(sorted);

            if (sorted.length) {
                const latest = sorted[0];
                setSelectedId(latest._id);
                await loadVersionToUI(latest._id);
                setBody(latest.body || '');
            } else {
                setSelectedId(null);
                setBody('');
            }
        } catch (e) {
            setMsg('⚠️ ' + (e.message || e));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);


    // Click handler for a specific version
    const handleSelectVersion = useCallback(
        async (id) => {
            console.log('id', id);
            const v = vs.find(x => x._id === id);
            if (!v) return;
            setSelectedId(id);
            // await loadVersionToUI(id);
            setBody(v.body || '');
        },
        []
    );


    // async function load() { try { setVs(await versions(prompt._id, orgId)); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } }
    useEffect(() => { load(); }, [prompt._id]);


    async function save() { const v = await createVersion(prompt._id, body, orgId); setVs([v, ...vs]); setMsg('Saved as version ' + v.number); }
    async function submit() { const id = vs[0]?._id; if (!id) return; await submitVersion(id, orgId); setMsg('Submitted for approval'); }
    async function runPreview() {
        const o = Object.fromEntries(vars.split(/\n+/).filter(Boolean).map(line => { const [k, ...rest] = line.split('='); return [k.trim(), rest.join('=').trim()]; }));
        const r = await preview(body, o, orgId); setOut(r.preview);
    }


    return (
        <div>
            <button onClick={onBack} style={{ marginBottom: 8, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>← Back</button>
            <h3>{prompt.title}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label>Prompt body
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={18} placeholder="Use variables like {{name}}, {{product}}" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button onClick={save} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Save version</button>
                        <button onClick={submit} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Submit for approval</button>
                        <button onClick={runPreview} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#111', color: '#fff' }}>Preview (Gemini)</button>
                    </div>
                    {msg && <div style={{ marginTop: 6, opacity: 0.7 }}>{msg}</div>}
                </div>
                <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Vars (key=value each line)</div>
                    <textarea value={vars} onChange={e => setVars(e.target.value)} rows={6} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Preview output</div>
                    <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', borderRadius: 8, padding: 8, minHeight: 180 }}>{out}</pre>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Versions</div>
                    <ul>
                        {vs.map(v => (
                            <li key={v._id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectVersion(v._id)}
                                    aria-pressed={selectedId === v._id}
                                    className={selectedId === v._id ? 'selected' : undefined}
                                    title={`Click to load v${v.number}`}
                                    style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, textAlign: 'left' }}
                                >
                                    {`v${v.number} — ${v.state}`}
                                    {' '}
                                    {v.approvedAt ? ('· ' + new Date(v.approvedAt).toLocaleString()) : ''}
                                </button>
                            </li>
                        ))}
                    </ul>

                </div>
            </div>
        </div>
    );
}