import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Mistral } from "@mistralai/mistralai";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export type AIProvider =
  | "groq"
  | "gemini"
  | "openrouter"
  | "cerebras"
  | "mistral";

export interface ProviderConfig {
  name: string;
  model: string;
  description: string;
  available: boolean;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  groq: {
    name: "Groq",
    model: "llama-3.3-70b-versatile",
    description: "Fast inference with Llama 3.3 70B",
    available: true,
  },
  gemini: {
    name: "Google Gemini",
    model: "gemini-2.0-flash-exp",
    description: "Google's latest Gemini model",
    available: true,
  },
  openrouter: {
    name: "OpenRouter Mistral",
    model: "mistralai/mistral-7b-instruct",
    description: "Mistral 7B via OpenRouter",
    available: true,
  },
  cerebras: {
    name: "Cerebras AI",
    model: "llama3.1-8b",
    description: "Fast inference with Cerebras hardware",
    available: true,
  },
  mistral: {
    name: "Mistral AI",
    model: "mistral-small-latest",
    description: "Mistral Small model",
    available: true,
  },
};

class AIProviderService {
  private groqClient?: Groq;
  private geminiClient?: GoogleGenerativeAI;
  private openrouterClient?: OpenAI;
  private cerebrasClient?: OpenAI;
  private mistralClient?: Mistral;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Groq
    if (process.env.GROQ_API_KEY) {
      this.groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    // Initialize OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      this.openrouterClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });
    }

    // Initialize Cerebras (uses OpenAI-compatible API)
    if (process.env.CEREBRAS_API_KEY) {
      this.cerebrasClient = new OpenAI({
        baseURL: "https://api.cerebras.ai/v1",
        apiKey: process.env.CEREBRAS_API_KEY,
      });
    }

    // Initialize Mistral
    if (process.env.MISTRAL_API_KEY) {
      this.mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    }
  }

  async *streamChat(
    provider: AIProvider,
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    try {
      switch (provider) {
        case "groq":
          yield* this.streamGroq(messages);
          break;
        case "gemini":
          yield* this.streamGemini(messages);
          break;
        case "openrouter":
          yield* this.streamOpenRouter(messages);
          break;
        case "cerebras":
          yield* this.streamCerebras(messages);
          break;
        case "mistral":
          yield* this.streamMistral(messages);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      throw error;
    }
  }

  private async *streamGroq(
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    if (!this.groqClient) {
      throw new Error("Groq client not initialized");
    }

    const response = await this.groqClient.chat.completions.create({
      model: PROVIDER_CONFIGS.groq.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: "", done: true };
  }

  private async *streamGemini(
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const model = this.geminiClient.getGenerativeModel({
      model: PROVIDER_CONFIGS.gemini.model,
    });

    // Convert messages to Gemini format
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const chat = model.startChat({
      systemInstruction: systemMessage?.content || "",
      history: conversationMessages.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const content = chunk.text();
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: "", done: true };
  }

  private async *streamOpenRouter(
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    if (!this.openrouterClient) {
      throw new Error("OpenRouter client not initialized");
    }

    const response = await this.openrouterClient.chat.completions.create({
      model: PROVIDER_CONFIGS.openrouter.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: "", done: true };
  }

  private async *streamCerebras(
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    if (!this.cerebrasClient) {
      throw new Error("Cerebras client not initialized");
    }

    const response = await this.cerebrasClient.chat.completions.create({
      model: PROVIDER_CONFIGS.cerebras.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: "", done: true };
  }

  private async *streamMistral(
    messages: AIMessage[]
  ): AsyncGenerator<StreamChunk> {
    if (!this.mistralClient) {
      throw new Error("Mistral client not initialized");
    }

    const response = await this.mistralClient.chat.stream({
      model: PROVIDER_CONFIGS.mistral.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      maxTokens: 1000,
    });

    for await (const chunk of response) {
      const content = chunk.data.choices[0]?.delta?.content || "";
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: "", done: true };
  }

  isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case "groq":
        return !!this.groqClient;
      case "gemini":
        return !!this.geminiClient;
      case "openrouter":
        return !!this.openrouterClient;
      case "cerebras":
        return !!this.cerebrasClient;
      case "mistral":
        return !!this.mistralClient;
      default:
        return false;
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Object.keys(PROVIDER_CONFIGS).filter((provider) =>
      this.isProviderAvailable(provider as AIProvider)
    ) as AIProvider[];
  }
}

export const aiProviderService = new AIProviderService();
