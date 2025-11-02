import { PDFParse } from 'pdf-parse';

export async function extractPdfPages(bufferOrUrl) {
    // Accept either a Buffer (for local data) or a URL string
    const parser = new PDFParse(
        // you pass an object with either `data` (buffer) or `url`
        typeof bufferOrUrl === 'string'
            ? { url: bufferOrUrl }
            : { data: bufferOrUrl }
    );

    try {
        // Retrieve the full text and pages info
        const result = await parser.getText();
        const fullText = result.text;
        const totalPages = result.total ?? result.numpages;  // depending on version
        // Split pages by form‐feed (if present)
        let pageTexts = fullText.split('\f').map(t => t.trim()).filter(Boolean);

        // If splitting by form‐feed didn't give you correct count, fallback
        if (pageTexts.length < totalPages) {
            pageTexts = fullText.split(/\n\s*\n\s*\n+/).map(t => t.trim()).filter(Boolean);
        }
        return pageTexts

    } finally {
        // Always destroy the parser to free resources
        await parser.destroy();
    }
}
