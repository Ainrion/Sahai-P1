# Multi-Provider AI Chatbot Deployment Guide

## 🎯 Overview

This version of Sahai chatbot supports **5 different AI providers** to distribute load and avoid hitting free tier limits:

1. **Groq** - Fast inference with Llama 3.3 70B
2. **Google Gemini** - Latest Gemini 2.0 Flash model
3. **OpenRouter Mistral** - Mistral 7B via OpenRouter
4. **Cerebras AI** - Fast inference with Llama 3.1 8B
5. **Mistral AI** - Direct Mistral Small model

## ✨ Key Features

- **🔄 Dynamic Model Selection** - Users can switch between AI providers in real-time
- **⚡ Load Distribution** - Automatically distribute requests across providers
- **💰 Cost Optimization** - Use free tiers across multiple providers
- **🛡️ Fault Tolerance** - If one provider fails, users can switch to another
- **📊 Health Monitoring** - Real-time status of all providers

## 🚀 Quick Deployment

### Step 1: Environment Variables

Set up API keys for the providers you want to use. **You need at least one API key**:

```bash
# AI Provider API Keys (Set at least one)
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=AIzaSyYour_gemini_api_key_here
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
CEREBRAS_API_KEY=csk-your_cerebras_key_here
MISTRAL_API_KEY=your_mistral_api_key_here

# Optional: Default Provider
DEFAULT_PROVIDER=groq

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 2: Get API Keys

#### 1. Groq (Recommended - Fastest)

- Visit: [console.groq.com](https://console.groq.com)
- Free tier: Good rate limits
- Models: Llama 3.3 70B, Mixtral 8x7B

#### 2. Google Gemini (Recommended - Most Generous)

- Visit: [ai.google.dev](https://ai.google.dev)
- Free tier: 15 RPM, 1M TPM, 1500 RPD
- Models: Gemini 2.0 Flash

#### 3. OpenRouter (Good for Variety)

- Visit: [openrouter.ai](https://openrouter.ai)
- Free tier: $1 monthly credit
- Models: Access to many models including Mistral

#### 4. Cerebras AI (Fast Inference)

- Visit: [api.cerebras.ai](https://api.cerebras.ai)
- Free tier: Available
- Models: Llama 3.1 8B optimized for speed

#### 5. Mistral AI (Direct Access)

- Visit: [console.mistral.ai](https://console.mistral.ai)
- Free tier: Available with limits
- Models: Mistral Small, Mistral 7B

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GROQ_API_KEY
vercel env add GEMINI_API_KEY
# ... add other keys as needed
```

#### Option B: GitHub Integration

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## 🎮 Usage

### Model Selection

- Users can select their preferred AI model from the dropdown
- Models show as "Available" (green) or "API Key Required" (red)
- Selection persists during the chat session

### Load Balancing Strategy

1. **User Choice** - Users can manually select preferred provider
2. **Fallback** - If a provider fails, suggest switching to available alternatives
3. **Rate Limit Handling** - Error messages guide users to switch providers

### Health Check

Visit `/api/chat/health` to see:

- Which providers are configured
- Available vs unavailable models
- Overall system health

## 📊 Free Tier Limits Summary

| Provider       | Free Tier Limits            | Best For                     |
| -------------- | --------------------------- | ---------------------------- |
| **Groq**       | Good limits, fast inference | Speed, reliability           |
| **Gemini**     | 15 RPM, 1500 RPD            | High volume, generous limits |
| **OpenRouter** | $1/month credit             | Model variety                |
| **Cerebras**   | TBD limits                  | Fast inference               |
| **Mistral**    | Limited free tier           | Direct Mistral access        |

## 🔧 Configuration Options

### Default Provider

Set which provider loads by default:

```bash
DEFAULT_PROVIDER=gemini  # or groq, openrouter, cerebras, mistral
```

### Provider-Specific Settings

Each provider uses optimized settings:

- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 1000 (reasonable response length)
- **Streaming**: Enabled for all providers

## 🛠️ Troubleshooting

### "No providers available"

- Ensure at least one API key is set
- Check API key format and validity
- Verify environment variables are properly set

### "Rate limit exceeded"

- Switch to a different provider using the dropdown
- Wait for rate limit to reset
- Consider getting API keys for more providers

### Provider-specific errors

- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Switch providers or wait
- **500 Server Error**: Provider temporarily unavailable

### Health Check Endpoint

```bash
curl https://your-app.vercel.app/api/chat/health
```

Returns status of all providers and available models.

## 💡 Cost Optimization Tips

1. **Distribute Usage**: Use different providers throughout the day
2. **Monitor Limits**: Check usage in each provider's console
3. **User Education**: Inform users about switching models when needed
4. **Graceful Degradation**: Always have backup providers configured

## 🔄 Model Switching Flow

1. User selects model from dropdown
2. System validates provider availability
3. Requests route to selected provider
4. If provider fails, error suggests alternatives
5. User can switch without losing conversation

## 📈 Scaling Strategy

### Phase 1: Free Tiers

- Use all 5 providers' free tiers
- Implement smart load distribution
- Monitor usage across providers

### Phase 2: Selective Upgrades

- Upgrade most-used providers to paid tiers
- Keep others as free tier backups
- Implement usage analytics

### Phase 3: Enterprise

- Consider dedicated instances
- Implement user-based routing
- Add premium model options

## 🎯 Best Practices

1. **Set Multiple Keys**: Configure at least 2-3 providers
2. **Monitor Health**: Regular health checks
3. **User Guidance**: Clear error messages with alternatives
4. **Graceful Failures**: Always suggest working alternatives
5. **Usage Analytics**: Track which providers work best

## 🚀 Ready to Deploy!

Your multi-provider chatbot is now ready for deployment with:

- ✅ 5 AI providers for load distribution
- ✅ Dynamic model selection
- ✅ Fault tolerance and fallbacks
- ✅ Cost-effective free tier usage
- ✅ Real-time health monitoring

Deploy and enjoy unlimited conversations across multiple AI providers! 🎉
