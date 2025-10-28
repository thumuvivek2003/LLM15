export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      background: isUser ? '#e8f0fe' : '#f5f5f5',
      borderRadius: 12,
      padding: '10px 12px',
      margin: '6px 0',
      maxWidth: 560,
      whiteSpace: 'pre-wrap',
      lineHeight: 1.5
    }}>
      <strong style={{ opacity: 0.7 }}>{isUser ? 'You' : 'Assistant'}</strong>
      <div>{content}</div>
    </div>
  );
}
