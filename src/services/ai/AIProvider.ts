export interface AICompletionRequest {
	systemPrompt: string;
	userMessage: string;
	apiKey: string;
	model: string;
	fetchUrl?: string; // if present, the provider should try to fetch/read this URL as part of the request
}

export interface AICompletionResult {
	text: string | null;
	error: string | null;
}

export interface AIProvider {
	complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
