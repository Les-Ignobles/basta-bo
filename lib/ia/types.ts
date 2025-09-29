export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    temperature?: number;
    schemaType?: any;
    schemaName?: string;
    maxTokens?: number;
}

export interface EmbeddingOptions {
    input: string;
}

export type IAModel = string;
