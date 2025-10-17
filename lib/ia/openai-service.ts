;
import { zodTextFormat } from 'openai/helpers/zod'
import {
    CompletionOptions,
    EmbeddingOptions,
} from './types';
import { IaService } from './ia-service';

// Mock createOpenAiClient function - replace with your actual implementation
async function createOpenAiClient() {
    const { OpenAI } = await import('openai');
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export class OpenaiIaService extends IaService {

    async generateEmbedding({ input }: EmbeddingOptions): Promise<Array<number>> {
        const client = await createOpenAiClient();

        const result = await client.embeddings.create({
            model: this.model,
            input,
            encoding_format: 'float',
        });

        return result.data[0].embedding;
    }

    async getCompletionResult<T>(options: CompletionOptions): Promise<T> {
        const client = await createOpenAiClient();

        const { temperature, schemaType, schemaName, maxTokens } = options;

        const schemaProvided = schemaType && schemaName;

        if (schemaProvided && schemaType) {
            const result = await client.responses.parse({
                model: this.model,
                input: this.messages,
                max_output_tokens: maxTokens,
                temperature: temperature,
                text: {
                    format: zodTextFormat(schemaType, schemaName),
                },
            });

            return result.output_parsed as T;
        }

        const result = await client.chat.completions.create({
            model: this.model,
            messages: this.messages,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
        });

        return result.choices[0]?.message?.content as T;
    }
}
