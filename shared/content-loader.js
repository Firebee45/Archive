import { parse } from 'https://cdn.jsdelivr.net/npm/yaml@2.8.1/+esm';

export async function loadYamlContent(input) {
    const url = input instanceof URL ? input : new URL(input, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
    }

    const documentData = parse(await response.text());
    if (!documentData || typeof documentData.content !== 'string') {
        throw new Error(`YAML content file ${url} must have a string "content" field.`);
    }
    if (documentData.lineEndings !== undefined && !['LF', 'CRLF'].includes(documentData.lineEndings)) {
        throw new Error(`YAML content file ${url} has invalid line ending metadata.`);
    }
    return documentData.lineEndings === 'CRLF'
        ? documentData.content.replace(/\n/g, '\r\n')
        : documentData.content;
}
