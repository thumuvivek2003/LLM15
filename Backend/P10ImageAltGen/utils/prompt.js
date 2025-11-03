export function buildPrompt({ lang = 'en', length = 'short', includeText = true, extraContext = '' }) {
    const len = length === 'short' ? 'Write a concise alt text of 5–15 words.' : length === 'long' ? 'Write a descriptive alt text of 1–2 sentences.' : 'Write a concise alt text.';
    const langLine = `Write in language: ${lang}.`;
    const a11y = [
        'Accessibility rules:',
        '- Do NOT start with "Image of" or "Picture of".',
        '- Mention on-image text if essential; otherwise omit decorative text.',
        '- Describe what is essential to understand purpose/context.',
        '- Include color or position only when meaningful to the task.',
        '- Avoid sensitive assumptions (age, health, religion, etc.).'
    ].join('\n');
    const includeTxt = includeText ? 'If the image contains clearly legible text that is central, include it succinctly.' : 'Ignore text in the image unless vital.';


    const fewshot = [
        'You are an expert accessibility writer generating alt text for images.',
        'Return alt text on the first line. On the second line, return an optional caption prefixed by "Caption:" only if a longer description is genuinely helpful.'
    ].join('\n');


    const extra = extraContext ? `Context from user: ${extraContext}` : '';


    return [fewshot, len, langLine, a11y, includeTxt, extra].filter(Boolean).join('\n');
}