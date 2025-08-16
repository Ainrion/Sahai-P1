# Deployment Guide for Sahai Chatbot

## Overview

This is the simplified version of Sahai chatbot that uses Groq API instead of local models and RAG functionality, making it suitable for Vercel deployment with minimal costs.

## Changes Made

- ✅ Replaced Ollama local model with Groq API
- ✅ Removed RAG functionality (Weaviate, Neo4j, GraphRAG)
- ✅ Simplified dependencies for cloud deployment
- ✅ Removed complex vector search and graph databases
- ✅ Maintained core cultural assistant functionality

## Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Required: Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Optional: Model Selection (defaults to llama-3.3-70b-versatile)
GROQ_MODEL=llama-3.3-70b-versatile

# Optional: Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

## Getting Groq API Key

1. Visit [Groq Console](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your environment variables

## Vercel Deployment

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GROQ_API_KEY
# Paste your Groq API key when prompted
```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `GROQ_API_KEY` with your API key value

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local file with your Groq API key
echo "GROQ_API_KEY=your_api_key_here" > .env.local

# Run development server
npm run dev
```

## API Endpoints

- `POST /api/chat` - Main chat endpoint using Groq API
- `GET /api/chat/health` - Health check for Groq API connection

## Features Retained

- ✅ Streaming chat responses
- ✅ Conversation history (last 10 messages)
- ✅ Indian cultural knowledge responses
- ✅ Modern WhatsApp-like UI
- ✅ Responsive design
- ✅ Error handling

## Features Removed

- ❌ RAG (Retrieval-Augmented Generation)
- ❌ Vector search with Weaviate
- ❌ Graph database with Neo4j
- ❌ Document upload and processing
- ❌ Complex cultural knowledge base
- ❌ Local Ollama model dependency

## Cost Optimization

This simplified version significantly reduces costs by:

- Using Groq's cost-effective API instead of hosting local models
- Removing database dependencies (Weaviate, Neo4j)
- Eliminating complex RAG infrastructure
- Reducing memory and compute requirements

## Troubleshooting

### Common Issues

1. **"Groq API key not configured"**

   - Ensure `GROQ_API_KEY` is set in your environment variables
   - Verify the API key is valid

2. **"Rate limit exceeded"**

   - Groq has rate limits on free tier
   - Consider upgrading to paid plan for higher limits

3. **Build failures on Vercel**
   - Check that all removed dependencies are cleaned up
   - Ensure no imports reference deleted files

### Health Check

Visit `/api/chat/health` to verify Groq API connectivity.

## Support

For issues with:

- Groq API: Check [Groq Documentation](https://console.groq.com/docs)
- Vercel Deployment: Check [Vercel Documentation](https://vercel.com/docs)
