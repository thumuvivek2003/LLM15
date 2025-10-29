const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';


async function callOpenAI({ model, messages, temperature = 0.2, top_p = 1 }) {
    const r = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, temperature, top_p })
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '(no body)');
        throw new Error('OpenAI error: ' + t);
    }
    const json = await r.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
}


function mapPrompt(mode, bullets, length, includeQuotes, chunk) {
    const style = (
        mode === 'minutes' ? 'Produce structured meeting minutes with sections: Attendees (if present), Agenda, Decisions, Action Items (owner + due date if given), Risks/Blockers.' :
            mode === 'brief' ? 'Produce an executive brief: Objective, Key Points, Data/Numbers, Risks, Next Steps.' :
                'Produce a TL;DR list.'
    );
    return [
        `You are a precise summarizer. ${style}`,
        `Write up to ${bullets} bullets. Length focus: ${length}.`,
        includeQuotes ? 'If there are short key quotes (<=20 words), include at most 1–2.' : 'Do not include verbatim quotes.',
        'Stay faithful; do not invent facts; keep dates/numbers.',
        '\n--- CHUNK START ---\n',
        chunk,
        '\n--- CHUNK END ---'
    ].join('\n');
}


export async function summarizeChunks({ chunks, mode, bullets, length, includeQuotes, model = 'gpt-4o-mini' }) {
    // Map: summarize each chunk in the selected style
    const partials = [];
    for (const c of chunks) {
        const summary = await callOpenAI({
            model,
            messages: [
                { role: 'system', content: 'You summarize long notes faithfully and concisely.' },
                { role: 'user', content: mapPrompt(mode, bullets, length, includeQuotes, c) }
            ],
            temperature: 0.2
        });
        partials.push(summary);
    }


    // Reduce: merge partials into a single non‑redundant output
    const style = (
        mode === 'minutes' ? 'Merge into clean meeting minutes with the same sections.' :
            mode === 'brief' ? 'Merge into a tight executive brief (Objective, Key Points, Data/Numbers, Risks, Next Steps).' :
                'Merge into TL;DR bullets.'
    );


    const final = await callOpenAI({
        model,
        messages: [
            { role: 'system', content: 'You merge summaries into one concise, non‑redundant result. Keep numbers/names/dates accurate.' },
            {
                role: 'user', content: [
                    `${style} Up to ${bullets} bullets. Length focus: ${length}.`,
                    'Eliminate duplicates; keep critical facts and decisions.',
                    includeQuotes ? 'Preserve at most 1–2 essential short quotes.' : 'Remove any quotes.',
                    '\n--- SUMMARIES START ---\n',
                    partials.join('\n\n'),
                    '\n--- SUMMARIES END ---'
                ].join('\n')
            }
        ],
        temperature: 0.2
    });


    return { partials, final };
}