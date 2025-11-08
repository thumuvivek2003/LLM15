import Chat from './components/Chat';
export default function P15LongContextChat() {
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Long‑Context Chat (Gemini)</h2>
            <Chat />
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Tip: Toggle memory to see how summary affects responses. Edit notes/highlights to correct the assistant.
            </div>
        </div>
    );
}