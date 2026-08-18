export interface AICompletionRequest {
	systemPrompt: string;
	userMessage: string;
	apiKey: string;
	model: string;
}

export interface AITokenUsage {
	inputTokens: number;
	outputTokens: number;
}

export interface AICompletionResult {
	text: string | null;
	error: string | null;
}

export interface AIProvider {
	complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
