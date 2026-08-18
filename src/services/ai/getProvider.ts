import { AIProvider } from './AIProvider';
import { AIProviderId } from './types';
import { anthropicProvider } from './anthropicProvider';

export function getProvider(providerId: AIProviderId): AIProvider {
	switch (providerId) {
		case 'anthropic':
			return anthropicProvider;
	}
}
