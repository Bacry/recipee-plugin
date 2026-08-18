import { AIProvider } from './AIProvider';
import { AIProviderId } from './types';
import { anthropicProvider } from './anthropicProvider';
import { openaiProvider } from './openaiProvider';

export function getProvider(providerId: AIProviderId): AIProvider {
	switch (providerId) {
		case 'anthropic':
			return anthropicProvider;
		case 'openai':
			return openaiProvider;
	}
}
