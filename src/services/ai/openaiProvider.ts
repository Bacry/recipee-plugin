import { requestUrl } from 'obsidian';
import { AIProvider, AICompletionRequest, AICompletionResult } from './AIProvider';

// OpenAI's Chat Completions API doesn't have a direct "fetch this exact URL"
// server tool the way Anthropic's web_fetch does — request.fetchUrl is
// accepted for interface compatibility but currently has no effect here.
export const openaiProvider: AIProvider = {
	async complete(request: AICompletionRequest): Promise<AICompletionResult> {
		if (request.apiKey.trim() === '') {
			return { text: null, error: 'No OpenAI API key configured in settings.' };
		}

		try {
			const response = await requestUrl({
				url: 'https://api.openai.com/v1/chat/completions',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${request.apiKey}`,
				},
				body: JSON.stringify({
					model: request.model,
					max_completion_tokens: 1500,
					response_format: { type: 'json_object' },
					messages: [
						{ role: 'system', content: request.systemPrompt },
						{ role: 'user', content: request.userMessage },
					],
				}),
				throw: false,
			});

			const data = response.json;

			if (response.status >= 400) {
				const detail = data?.error?.message ?? `HTTP ${response.status}`;
				return { text: null, error: `API call error: ${detail}` };
			}

			const text = data.choices?.[0]?.message?.content;
			if (!text) {
				return { text: null, error: 'Unexpected API response (no text found).' };
			}

			const usage = data.usage
				? { inputTokens: data.usage.prompt_tokens ?? 0, outputTokens: data.usage.completion_tokens ?? 0 }
				: undefined;

			return { text, error: null, usage };
		} catch (e) {
			return { text: null, error: `API call error: ${e}` };
		}
	},
};
