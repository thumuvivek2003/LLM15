export default function MessageBubble({ role, content }) {
    const isUser = role === 'user';
    return (
        <div style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: 720 }}>
            <div style={{ fontSize: 12, opacity: 0.6, margin: '2px 4px' }}>{isUser ? 'You' : 'Assistant'}</div>
            <div style={{ background: isUser ? '#e8f0fe' : '#f5f5f5', borderRadius: 12, padding: '10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {content}
            </div>
        </div>
    );
}