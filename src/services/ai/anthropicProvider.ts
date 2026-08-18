import { requestUrl } from 'obsidian';
import { AIProvider, AICompletionRequest, AICompletionResult } from './AIProvider';

export const anthropicProvider: AIProvider = {
	async complete(request: AICompletionRequest): Promise<AICompletionResult> {
		if (request.apiKey.trim() === '') {
			return { text: null, error: 'No Anthropic API key configured in settings.' };
		}

		try {
			const response = await requestUrl({
				url: 'https://api.anthropic.com/v1/messages',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': request.apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: request.model,
					max_tokens: 1500,
					system: request.systemPrompt,
					messages: [{ role: 'user', content: request.userMessage }],
				}),
			});

			const data = response.json;
			const textBlock = data.content?.find((block: any) => block.type === 'text');
			if (!textBlock) {
				return { text: null, error: 'Unexpected API response (no text found).' };
			}

			const usage = data.usage
				? { inputTokens: data.usage.input_tokens ?? 0, outputTokens: data.usage.output_tokens ?? 0 }
				: undefined;

			return { text: textBlock.text, error: null, usage };
		} catch (e) {
			return { text: null, error: `API call error: ${e}` };
		}
	},
};
