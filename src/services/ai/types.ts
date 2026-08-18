export type AIProviderId = 'anthropic' | 'openai';

export interface AIModelOption {
	id: string;
	label: string;
}

export interface AIProviderInfo {
	id: AIProviderId;
	label: string;
	apiKeyPlaceholder: string;
	models: AIModelOption[];
}

export interface AICredentials {
	apiKey: string;
	model: string;
}

export function emptyCredentials(): AICredentials {
	return { apiKey: '', model: '' };
}

// Static registry — the single source of truth for "which providers exist,
// and which models each one offers". Adding a new provider later means
// adding one entry here, plus one new file implementing AIProvider (see
// AIProvider.ts) — nothing else needs to know about the new provider.
export const AI_PROVIDERS: AIProviderInfo[] = [
	{
		id: 'anthropic',
		label: 'Anthropic (Claude)',
		apiKeyPlaceholder: 'sk-ant-...',
		models: [
			{ id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fast, cheap)' },
			{ id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (balanced)' },
			{ id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
		],
	},
	{
		id: 'openai',
		label: 'OpenAI (ChatGPT)',
		apiKeyPlaceholder: 'sk-...',
		models: [
			{ id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (fast, cheap)' },
			{ id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra (balanced)' },
			{ id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol (most capable)' },
		],
	},
];

export const DEFAULT_AI_CREDENTIALS: Record<AIProviderId, AICredentials> = {
	anthropic: { apiKey: '', model: 'claude-sonnet-5' },
	openai: { apiKey: '', model: 'gpt-5.6-terra' },
};

export function getProviderInfo(providerId: AIProviderId): AIProviderInfo | undefined {
	return AI_PROVIDERS.find((p) => p.id === providerId);
}
