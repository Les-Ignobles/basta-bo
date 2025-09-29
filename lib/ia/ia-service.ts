import {
    ChatMessage,
    CompletionOptions,
    EmbeddingOptions,
    IAModel,
} from './types';

export abstract class IaService {
    protected messages: ChatMessage[] = [];

    constructor(protected model: IAModel) { }

    abstract getCompletionResult<T>(options: CompletionOptions): Promise<T>;
    abstract generateEmbedding(options: EmbeddingOptions): Promise<Array<number>>;

    setSystem(content: string): this {
        const i = this.messages.findIndex((m) => m.role === 'system');
        if (i >= 0) this.messages[i] = { role: 'system', content };
        else this.messages.unshift({ role: 'system', content });
        return this;
    }
    addUser(content: string): this {
        this.messages.push({ role: 'user', content });
        return this;
    }
    addAssistant(content: string): this {
        this.messages.push({ role: 'assistant', content });
        return this;
    }
    add(role: ChatMessage['role'], content: string): this {
        this.messages.push({ role, content });
        return this;
    }
    setMessages(messages: ChatMessage[], keepSingleSystem = false): this {
        if (keepSingleSystem) {
            const sys = messages.find((m) => m.role === 'system');
            this.messages = sys
                ? [sys, ...messages.filter((m) => m.role !== 'system')]
                : [...messages];
        } else {
            this.messages = [...messages];
        }
        return this;
    }
    clearMessages({ keepSystem = false }: { keepSystem?: boolean } = {}): this {
        if (!keepSystem) {
            this.messages = [];
        } else {
            const sys = this.messages.find((m) => m.role === 'system');
            this.messages = sys ? [sys] : [];
        }
        return this;
    }

    getSystemMessages() {
        return this._getMessagesByRole('system');
    }

    getUserMessages() {
        return this._getMessagesByRole('user');
    }

    _getMessagesByRole(role: ChatMessage['role'], separator: string = '. ') {
        return this.messages
            .filter(($m) => $m.role === role)
            .map(($m) => $m.content)
            .join(separator);
    }
}
