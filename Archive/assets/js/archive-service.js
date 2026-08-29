import { parseBuildMarkdown, parseTagColours, toPlainText } from './build-markdown.js';

export async function fetchArchiveData() {
    try {
        const [manifestResponse, colorsResponse] = await Promise.all([
            fetch('listing-data/manifest.json'),
            fetch('listing-data/tag-colours.md').catch(() => null)
        ]);

        if (!manifestResponse.ok) throw new Error('Could not resolve listing-data/manifest.json framework file.');

        const fileList = await manifestResponse.json();
        let tagColors = {};
        if (colorsResponse && colorsResponse.ok) {
            tagColors = parseTagColours(await colorsResponse.text());
        }

        const cardPromises = fileList.map(async (fileName) => {
            try {
                const cardResponse = await fetch(`listing-data/${fileName}`);
                if (!cardResponse.ok) throw new Error(`Status ${cardResponse.status}`);
                const fileText = await cardResponse.text();
                const parsed = parseBuildMarkdown(fileText);
                return { ...parsed, description: toPlainText(parsed.description), slug: fileName.replace(/\.md$/, '') };
            } catch (cardError) {
                console.warn(`Skipping individual asset [listing-data/${fileName}]:`, cardError.message);
                return null;
            }
        });

        const resolvedCards = await Promise.all(cardPromises);
        const cards = resolvedCards.filter(card => card !== null);
        return { cards, tagColors };

    } catch (error) {
        console.error("Critical error in split flat-file data-loader pipeline:", error);
        return { cards: [], tagColors: {} };
    }
}