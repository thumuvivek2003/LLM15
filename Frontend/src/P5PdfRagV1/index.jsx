import { useEffect, useState } from 'react';
import { listDocs, deleteDoc, uploadPdf, ask } from './api.js';
import Uploader from './components/Uploader.jsx';
import QA from './components/QA.jsx';


export default function P5PdfRagV1() {
    const [docs, setDocs] = useState([]);


    async function refresh() { setDocs(await listDocs()); }
    useEffect(() => { refresh(); }, []);


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <div>
                <h3>Documents</h3>
                <Uploader onUpload={async (f) => { const res = await uploadPdf(f); await refresh(); return res; }} />
                <div style={{ marginTop: 12 }}>
                    {docs.map(d => (
                        <div key={d._id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 8, marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>{d.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{d.pages} pages · {Math.round(d.sizeBytes / 1024)} KB</div>
                            <button onClick={async () => { await deleteDoc(d._id); await refresh(); }} style={{ marginTop: 6, padding: '6px 10px', border: '1px solid #f3c', borderRadius: 8 }}>Delete</button>
                        </div>
                    ))}
                    {docs.length === 0 && <div style={{ opacity: 0.7 }}>No PDFs yet</div>}
                </div>
            </div>


            <div>
                <h3>Q&A over your PDFs</h3>
                <QA onAsk={ask} />
            </div>
        </div>
    );
}