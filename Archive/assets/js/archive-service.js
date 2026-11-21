import { parseBuildMarkdown, parseTagColours, toPlainText } from './build-markdown.js';
import { loadYamlContent } from '../../../shared/content-loader.js';

export async function fetchArchiveData() {
    try {
        const [manifestResponse, colorsContent] = await Promise.all([
            fetch('listing-data/manifest.json'),
            loadYamlContent('listing-data/tag-colours.yaml').catch(() => null)
        ]);

        if (!manifestResponse.ok) throw new Error('Could not resolve listing-data/manifest.json framework file.');

        const fileList = await manifestResponse.json();
        let tagColors = {};
        if (colorsContent !== null) tagColors = parseTagColours(colorsContent);

        const cardPromises = fileList.map(async (fileName) => {
            try {
                const fileText = await loadYamlContent(`listing-data/${fileName}`);
                const parsed = parseBuildMarkdown(fileText);
                return { ...parsed, description: toPlainText(parsed.description), slug: fileName.replace(/\.yaml$/, '') };
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