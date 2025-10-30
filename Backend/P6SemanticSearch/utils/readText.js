export function fromBufferToText(buf, filename) {
    const name = filename.toLowerCase();
    const text = Buffer.from(buf).toString('utf8')
        .replace(/\r/g, '').replace(/\t/g, ' ').replace(/\n{3,}/g, '\n\n');
    if (name.endsWith('.md') || name.endsWith('.markdown')) {
        return text
            .replace(/```[\s\S]*?```/g, m => '\n\n' + m.replace(/```/g, '') + '\n\n')
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
            .replace(/^\s*#+\s*/gm, m => m.replace(/#+/g, '#'))
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1');
    }
    return text;
}