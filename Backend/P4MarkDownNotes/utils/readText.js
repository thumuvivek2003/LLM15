import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';


// Convert Markdown → plain text while keeping headings & lists readable
function markdownToText(md) {
    // marked can tokenize; we’ll do a very light conversion
    // Strip code fences lightly but keep content
    let text = md
        .replace(/```[\s\S]*?```/g, m => '\n\n' + m.replace(/```/g, '') + '\n\n')
        .replace(/<[^>]+>/g, '') // strip HTML tags
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links -> text
        .replace(/^\s*#+\s*/gm, m => m.replace(/#+/g, '#')) // normalize #s
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/^-\s+/gm, '• ')
        .replace(/^\d+\.\s+/gm, m => '• ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return text;
}


export async function readUploadedText(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const raw = await fs.readFile(filePath, 'utf8');
    if (ext === '.md' || ext === '.markdown' || /\n#|\n-\s|\n\d+\./.test(raw)) {
        return markdownToText(raw);
    }
    // .txt fallback
    return raw
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}