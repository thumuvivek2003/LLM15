export default function Playground({ output, streaming }) {
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, minHeight: 200, whiteSpace: 'pre-wrap' }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Output</div>
            <div>{output}</div>
            {streaming && <div style={{ opacity: 0.6, marginTop: 8 }}>…streaming</div>}
        </div>
    );
}