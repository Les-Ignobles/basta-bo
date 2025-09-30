import { ZodType } from 'zod';

export type ChatMessage =
    | { role: 'system'; content: string }
    | { role: 'user'; content: string }
    | { role: 'assistant'; content: string };

export type IAModel =
    // OPEN AI
    'gpt-4o-mini' | 'gpt-5-mini' | 'gpt-5-nano' | 'text-embedding-3-small';

export type CompletionOptions = {
    temperature?: number;
    maxTokens?: number;
    schemaType?: ZodType;
    schemaName?: string;
};

export type EmbeddingOptions = {
    input: string;
};
