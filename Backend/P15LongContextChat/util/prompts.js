export const SYSTEM = `You are a careful, concise assistant. Use the provided "Memory Notes" if present. If a user asks to change or forget memory, comply.`;


export function buildRecapPrompt(fullText) {
    return [
        'Summarize this conversation into: \n',
        '1) Memory Notes: durable facts, preferences, decisions (bullet list).\n',
        '2) Highlights: short quotable bullets for quick reference.\n',
        '3) Pending: open questions or next steps.\n',
        '\n--- Conversation ---\n', fullText
    ].join('');
}


export function buildUpdateSummaryPrompt(prevNotes, overflowText) {
    return [
        'Update the running Memory Notes using ONLY the new messages. Keep it concise and durable. Return JSON with {notes, highlights}.\n',
        'Previous Notes:\n', prevNotes || '(none)', '\n\nNew Messages:\n', overflowText
    ].join('');
}


export function getJsonTextFromCandidates(resp) {
    const parts =
        resp?.candidates?.[0]?.content?.parts ??
        resp?.candidates?.[0]?.content?.parts ??
        [];

    // join all text parts (ignore non-text parts)
    const text = parts
        .map((p) => (typeof p?.text === 'string' ? p.text : ''))
        .join('')
        .trim();

    if (!text) return null;

    // strip ```json ... ``` or ``` ... ``` fences if present
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return (fenced ? fenced[1] : text).trim();
}