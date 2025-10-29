const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';


async function callOpenAI({ model, messages, temperature = 0.2, top_p = 1 }) {
    const r = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, temperature, top_p, stream: false })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '(no body)');
        throw new Error('OpenAI error: ' + t);
    }
    const json = await r.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
}


export async function summarizeChunks({ chunks, bullets, length, includeQuotes, model = 'gpt-4o-mini' }) {
    // 1) Map: summarize each chunk
    const partials = [];
    for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        const summary = await callOpenAI({
            model,
            messages: [
                { role: 'system', content: 'You are a precise summarizer. Be faithful to the text, avoid speculation, keep it concise.' },
                {
                    role: 'user', content: [
                        `Summarize the following article chunk into up to ${bullets} bullet points.`,
                        `Length focus: ${length} (short=very brief; medium=balanced; long=more detail).`,
                        `${includeQuotes ? 'If there are short, verbatim key quotes (<=20 words), include 1–2 inline in quotes.' : 'Do not include verbatim quotes.'}`,
                        'Avoid repeating the title or already-stated bullets. Use neutral tone.',
                        '\n--- CHUNK START ---\n',
                        content,
                        '\n--- CHUNK END ---'
                    ].join('\n')
                }
            ],
            temperature: 0.2
        });
        partials.push(summary);
    }


    // 2) Reduce: combine partials into a final concise set
    const combined = await callOpenAI({
        model,
        messages: [
            { role: 'system', content: 'You combine multiple chunk summaries into one concise, non-redundant summary.' },
            {
                role: 'user', content: [
                    `Merge the following chunk summaries into a single summary with up to ${bullets} bullets.`,
                    `Length focus: ${length}.`,
                    'Eliminate duplicates, keep facts, and preserve important numbers, names, dates.',
                    includeQuotes ? 'Preserve at most 1–2 short quotes if essential.' : 'Remove any quotes.',
                    '\n--- SUMMARIES START ---\n',
                    partials.join('\n\n'),
                    '\n--- SUMMARIES END ---'
                ].join('\n')
            }
        ],
        temperature: 0.2
    });


    return { partials, final: combined };
}