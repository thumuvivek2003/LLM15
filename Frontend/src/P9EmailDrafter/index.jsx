import { useEffect, useState } from 'react';
import { login, me, list, message, generateReply, createDraft } from './api';
export default function P9EmailDrafter() {
    const [user, setUser] = useState(null);
    const [threads, setThreads] = useState([]);
    const [selected, setSelected] = useState(null);
    const [msg, setMsg] = useState(null);
    const [tone, setTone] = useState('neutral');
    const [length, setLength] = useState('medium');
    const [bullets, setBullets] = useState(false);
    const [rewriteSubject, setRewriteSubject] = useState(true);
    const [signature, setSignature] = useState('—\nThanks,\nYour Name');
    const [draft, setDraft] = useState('HEllo');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function ensureLogin() {
        try { const m = await me(); setUser(m); } catch { /* not authed */ }
    }
    useEffect(() => { ensureLogin(); }, []);


    async function doLogin() { await login(); const m = await me(); setUser(m); const t = await list(); setThreads(t); }
    async function pick(t) { setSelected(t); setDraft('Hello asdfsdf'); setMsg(await message(t.messageId)); }


    async function gen() {
        if (!msg) return;
        setBusy(true); setError('');
        try {
            const res = await generateReply({ messageId: msg.id, tone, length, bullets, rewriteSubject, addDisclaimer: true, signature });
            setDraft(res.draft);
        } catch (e) { setError(String(e.message || e)); }
        finally { setBusy(false); }
    }


    async function saveDraft() {
        alert('asdfsdf');
        if (!draft || !selected) return;
        const subj = rewriteSubject ? (draft.match(/^Subject:\s*(.*)$/m)?.[1] || selected.subject) : selected.subject;
        const to = (selected.from || '').match(/<([^>]+)>/)?.[1] || selected.from;
        const body = draft.replace(/^Subject:.*$/m, '').trim();
        const resp = await createDraft({ threadId: selected.threadId, to, subject: subj, body });   
        alert('Draft saved: ' + resp.draftId);
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Email Draft Assistant (Gmail + Gemini)</h2>
                <div>
                    {!user ? <button onClick={doLogin} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Sign in with Google</button>
                        : <span style={{ fontSize: 14, opacity: 0.8 }}>Signed in as {user.emailAddress}</span>}
                </div>
            </header>


            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 12, marginTop: 12 }}>
                <div>
                    <h3>Inbox</h3>
                    {!threads.length && user && <button onClick={async () => setThreads(await list())} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>Load latest</button>}
                    <div style={{ marginTop: 8 }}>
                        {threads.map(t => (
                            <div key={t.messageId} onClick={() => pick(t)} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, marginBottom: 8, cursor: 'pointer' }}>
                                <div style={{ fontWeight: 600 }}>{t.subject || '(no subject)'}</div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{t.from}</div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{t.snippet}</div>
                            </div>
                        ))}
                    </div>
                </div>


                <div>
                    <h3>Selected email</h3>
                    {msg ? (
                        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{selected.from}</div>
                            <div style={{ fontWeight: 700 }}>{selected.subject}</div>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{msg.plain}</pre>
                        </div>
                    ) : <div style={{ opacity: 0.6 }}>Pick an email from the left.</div>}


                    <h3 style={{ marginTop: 12 }}>Style</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        <label>Tone
                            <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                                <option value="formal">formal</option>
                                <option value="neutral">neutral</option>
                                <option value="friendly">friendly</option>
                            </select>
                        </label>
                        <label>Length
                            <select value={length} onChange={e => setLength(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                                <option value="short">short</option>
                                <option value="medium">medium</option>
                                <option value="long">long</option>
                            </select>
                        </label>
                        <label>Bullets
                            <input type="checkbox" checked={bullets} onChange={e => setBullets(e.target.checked)} />
                        </label>
                        <label>Rewrite Subject
                            <input type="checkbox" checked={rewriteSubject} onChange={e => setRewriteSubject(e.target.checked)} />
                        </label>
                    </div>

                    <label style={{ display: 'block', marginTop: 8 }}>Signature
                        <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    </label>


                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={gen} disabled={!msg || busy} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>{busy ? 'Generating…' : 'Generate reply'}</button>
                        <button onClick={saveDraft} disabled={!draft} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}>Create Gmail Draft</button>
                    </div>


                    {error && <div style={{ color: '#b00020', marginTop: 8 }}>⚠️ {error}</div>}


                    {draft && (
                        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, marginTop: 8 }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Draft</div>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{draft}</pre>
                        </div>
                    )}
                </div>
            </div>


            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 12 }}>
                ⚠️ This is a demo. Review drafts for accuracy and sensitive information before sending.
            </div>
        </div>
    );
}


