# Ollama Setup Guide for Sahai AI

## Phase 1 Requirements

To use the Sahai AI chatbot, you need to have Ollama running locally with the Llama 3.2 3B model.

## Installation Steps

### 1. Install Ollama

**Ubuntu/Debian:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows (WSL2):**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Mac:**

```bash
brew install ollama
```

### 2. Start Ollama Service

```bash
ollama serve
```

This will start Ollama on `http://localhost:11434`

### 3. Pull Llama 3.2 3B Model

```bash
ollama pull llama3.2:3b
```

**Alternative model names to try:**

- `ollama pull llama3.2`
- `ollama pull llama3`

### 4. Verify Installation

Check available models:

```bash
ollama list
```

Test the model:

```bash
ollama run llama3.2:3b "Hello, how are you?"
```

## System Requirements

- **RAM**: 6GB+ (3.4GB for model + 2GB for system)
- **GPU**: 6GB VRAM (your setup is perfect!)
- **Disk**: ~2.5GB for the model

## Troubleshooting

### Model Not Found Error

If you get a "model not found" error:

1. Check available models: `ollama list`
2. Try pulling with different name: `ollama pull llama3.2`
3. Update the model name in `src/app/api/chat/route.ts` line 6

### Connection Error

If you get "Cannot connect to Ollama":

1. Make sure Ollama is running: `ollama serve`
2. Check if port 11434 is available: `curl http://localhost:11434`
3. Restart Ollama service

### Performance Tips

- Close unnecessary applications to free up RAM
- Use `ollama run llama3.2:3b --verbose` for performance monitoring
- Consider using `ollama run llama3.2:3b --num-gpu 1` to force GPU usage

## Current Implementation

The chatbot includes:

- ✅ WhatsApp-inspired UI
- ✅ Real-time chat interface
- ✅ Ollama integration
- ✅ Hindi/English support
- ✅ Conversation history (10 messages)
- ✅ Connection status indicator
- ✅ Error handling
- ✅ Typing indicators

## Next Phases

- **Phase 2**: Weaviate RAG integration
- **Phase 3**: Neo4j GraphRAG
- **Phase 4**: Cultural datasets & fine-tuning
