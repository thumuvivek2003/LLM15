import { useState, useRef } from 'react';
import ChatMessage from './ChatMessage.jsx';
import { streamChat } from './api.js';

export default function P1ChatUI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything 🤖' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortRef = useRef(null);

  async function handleSend(e) {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || isStreaming) return;

    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setInput('');
    setIsStreaming(true);

    // placeholder assistant message we’ll stream into
    const idx = next.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let assistantText = '';

    try {
      await streamChat(next, (delta) => {
        assistantText += delta;
        // P1ChatUIend streamed delta into the last assistant message
        setMessages(prev => {
          const copy = prev.slice();
          copy[idx] = { role: 'assistant', content: assistantText };
          return copy;
        });
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${String(err.message || err)}`
      }]);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <header style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        fontWeight: 600
      }}>
        Chat UI — Hello LLM
      </header>

      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 16
      }}>
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} />
        ))}
      </main>

      <form onSubmit={handleSend} style={{
        display: 'flex',
        gap: 8,
        padding: 12,
        borderTop: '1px solid #eee'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? 'Generating…' : 'Type a message'}
          disabled={isStreaming}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            border: '1px solid #ddd', outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          style={{
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid #ddd', background: '#111', color: 'white'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
