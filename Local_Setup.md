# Local Setup Guide - Cultural Chatbot

## 🚀 Starting the System (After Complete Shutdown)

### Step 1: Start Core Services

```bash
# Start Docker daemon (if not already running)
sudo service docker start

# Start Ollama service
sudo systemctl start ollama

# Navigate to your project directory
cd sahai

# Start Docker container (it will automatically start both Weaviate and Neo4j)
docker-compose up -d

# Wait for Weaviate to be healthy (check status)
docker ps
# Look for "healthy" status on weaviate container
```

### Step 2: Verify Core Services are Running

```bash
# Check if Ollama service is active
sudo systemctl is-active ollama
# Should return "active"

# Check if Weaviate is accessible
curl http://localhost:8080/v1/meta
# Should return JSON with Weaviate version info
```

### Step 3: Start Next.js Application

```bash
# Install dependencies (if first time or after updates)
npm install

# Start the development server
npm run dev

# Server will start on http://localhost:3000
```

### Step 4: Initialize Weaviate Schema

```bash
# Initialize the cultural schema

# For weaviate
curl -X POST http://localhost:3000/api/weaviate/status -d '{"action": "initialize"}' -H "Content-Type: application/json"
# Expected response:
# {"success":true,"message":"Cultural schema initialized successfully"

# For neo4j
curl -X POST http://localhost:3000/api/neo4j/status -d '{"action": "initialize"}' -H "Content-Type: application/json"
# Expected response:
# {"success":true,"message":"Graph schema initialized successfully","metrics":

```

### Step 5: Populate Cultural Data

```bash
# In a new terminal, run the cultural data population script
node scripts/populate-cultural-data.js

# for graph
curl -X POST http://localhost:3000/api/graph/init -H "Content-Type: application/json"

# Expected output: "Successfully added 10 cultural entries"
```

### Step 6: Verify System is Working

```bash
# Test the search API
curl -X POST http://localhost:3000/api/search -d '{"query": "Diwali"}' -H "Content-Type: application/json"

# Should return cultural information about Diwali
```

## ✅ System Health Check

After following all steps, verify these services are running:

1. **Ollama**: `sudo systemctl is-active ollama` should return "active"
2. **Docker**: `docker ps` should show weaviate container as "healthy"
3. **Weaviate**: `curl http://localhost:8080/v1/meta` should return JSON
4. **Next.js**: Browser at `http://localhost:3000` should load your app
5. **Cultural Data**: Search API should return relevant cultural information

## 🔍 Troubleshooting Common Issues

### If Ollama service fails to start:

```bash
# Check Ollama service status
sudo systemctl status ollama

# Restart Ollama service
sudo systemctl restart ollama

# Check if Ollama is running
sudo systemctl is-active ollama
```

### If Weaviate container fails to start:

```bash
# Check container logs
docker logs weaviate

# Restart container
docker-compose restart weaviate
```

### If Next.js fails to start:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### If cultural data is missing:

```bash
# Re-run population script
node scripts/populate-cultural-data.js
```

## 🛑 Stopping the System

### Method 1: Graceful Shutdown

```bash
# Stop Next.js (Ctrl+C in the terminal running npm run dev)
# Then stop Docker containers
docker-compose down

# Stop Ollama service
sudo systemctl stop ollama

# Stop Docker daemon (optional)
sudo service docker stop
```

### Method 2: Quick Stop

```bash
# Stop all Docker containers
docker stop $(docker ps -q)

# Or stop specific container
docker stop weaviate
```

### Method 3: Complete Cleanup (if needed)

```bash
# Stop and remove containers
docker-compose down -v

# Remove unused Docker resources
docker system prune -f
```

## 📋 Quick Start Checklist

- [ ] Docker daemon started
- [ ] Ollama service started and active
- [ ] Weaviate container running and healthy
- [ ] Cultural schema initialized
- [ ] Next.js app running on port 3000
- [ ] Cultural data populated (10 entries)
- [ ] Search API tested and working
- [ ] Chatbot accessible in browser

## 🎯 Full Potential Features

When everything is running correctly, your chatbot will have:

- ✅ **Cultural Knowledge Base**: 10+ Indian cultural entries (Diwali, Holi, Biryani, etc.)
- ✅ **RAG System**: Real-time retrieval of cultural information
- ✅ **Enhanced Responses**: Contextually relevant answers about Indian culture
- ✅ **Search Capability**: Direct search API for cultural topics
- ✅ **Persistent Storage**: Data survives container restarts

## 🔧 Development Commands

```bash
# Check Ollama service status
sudo systemctl status ollama
sudo systemctl is-active ollama

# View container logs
docker logs weaviate

# Access Weaviate GraphQL interface
# Open browser: http://localhost:8080/v1/graphql

# Test specific API endpoints
curl -X POST http://localhost:3000/api/chat -d '{"message": "Tell me about Diwali"}' -H "Content-Type: application/json"

# Check Weaviate health
curl http://localhost:8080/v1/meta
```

## 📝 Notes

- **Startup Time**: Allow 30-60 seconds for Weaviate to become healthy
- **Data Persistence**: Cultural data persists across container restarts
- **Port Usage**: 3000 (Next.js), 8080 (Weaviate)
- **Environment**: Optimized for WSL2 Ubuntu 22.04
