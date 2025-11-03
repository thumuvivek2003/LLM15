export default function DownloadCSV({ rows }) {
    function toCSV() {
        const header = ['id', 'filename', 'url', 'lang', 'altText', 'caption'];
        const lines = [header.join(',')];
        for (const r of rows) {
            const vals = header.map(k => JSON.stringify(r[k] ?? '').replace(/\u2028|\u2029/g, ''));
            lines.push(vals.join(','));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'alttext.csv'; a.click(); URL.revokeObjectURL(url);
    }
    return <button onClick={toCSV} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Download CSV</button>;
}