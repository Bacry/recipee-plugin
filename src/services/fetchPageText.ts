import { requestUrl } from 'obsidian';

export interface FetchPageTextResult {
	text: string | null;
	error: string | null;
}

// Fetches a URL and extracts its readable text content, stripping scripts,
// styles, and common non-content chrome (nav/header/footer/aside) — a
// lightweight equivalent to using BeautifulSoup for this kind of cleanup,
// using the browser's native DOMParser (available in Obsidian's Electron
// environment) instead of a Python dependency. The cleaned text is then fed
// into the same recipe-extraction prompt as a manually pasted text, so the
// AI provider never needs to fetch anything itself.
export async function fetchPageText(url: string): Promise<FetchPageTextResult> {
	try {
		const response = await requestUrl({ url, throw: false });

		if (response.status >= 400) {
			return { text: null, error: `HTTP ${response.status} while fetching the page.` };
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString(response.text, 'text/html');

		// Remove elements that never contain recipe content, to keep the
		// text sent to the AI focused and short.
		doc.querySelectorAll('script, style, nav, header, footer, aside, noscript, svg, form, iframe').forEach((el) => el.remove());

		const rawText = doc.body?.textContent ?? '';

		// Collapse excessive whitespace left behind after stripping tags —
		// raw textContent from a full page is usually full of blank lines
		// and repeated spaces from the original HTML indentation.
		const cleaned = rawText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.join('\n');

		if (cleaned.length < 50) {
			return { text: null, error: 'The page appears to have no readable text content (it may require JavaScript to load).' };
		}

		// Cap the length to keep the AI prompt reasonable — recipe pages
		// rarely need more than this to contain the actual recipe, and it
		// avoids sending megabytes of unrelated boilerplate text.
		const MAX_LENGTH = 15000;
		const truncated = cleaned.length > MAX_LENGTH ? cleaned.slice(0, MAX_LENGTH) : cleaned;

		return { text: truncated, error: null };
	} catch (e) {
		return { text: null, error: `Could not fetch the page: ${e}` };
	}
}
