import { requestUrl } from 'obsidian';

export async function translateToEnglish(text: string): Promise<string> {
	if (text.trim() === '') return '';

	const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`;

	const response = await requestUrl({ url });
	const data = response.json;

	return data.responseData?.translatedText ?? '';
}
