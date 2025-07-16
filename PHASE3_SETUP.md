# Phase 3 - GraphRAG Implementation Setup Guide

## 🎯 Overview

Phase 3 adds **GraphRAG (Graph Retrieval-Augmented Generation)** capabilities to your cultural assistant with:

- ✅ **Neo4j graph database** for cultural knowledge relationships
- ✅ **Hybrid search** combining vector (Weaviate) and graph (Neo4j) results
- ✅ **Relationship queries** for understanding cultural connections
- ✅ **Social network analysis** of cultural influences
- ✅ **Complex reasoning** through multi-hop graph traversals
- ✅ **Enhanced conversation context** with cultural insights

## 🔄 What's New in Phase 3

### Enhanced Features

- **Graph-based cultural understanding** with entity relationships
- **Hybrid search** combining semantic vectors and knowledge graphs
- **Multi-hop reasoning** for complex cultural queries
- **Relationship insights** showing cultural connections
- **Enhanced chat responses** with deeper cultural context

### New API Endpoints

- `/api/neo4j/status` - Neo4j health check and management
- `/api/graph/search` - Advanced graph search and traversal
- `/api/graph/init` - Initialize cultural knowledge graph

## 📋 Prerequisites

- **Phase 1 & 2 completed** and running successfully
- **Docker and Docker Compose** installed
- **Node.js 18+** and npm
- **6GB+ RAM** (3GB for Neo4j + existing requirements)
- **2GB+ additional storage** for Neo4j data

## 🚀 Quick Start

### Step 1: Start the Enhanced Stack

```bash
# Start both Weaviate and Neo4j
docker-compose up -d

# Verify both databases are running
curl http://localhost:8080/v1/.well-known/ready  # Weaviate
curl http://localhost:7474                       # Neo4j Browser
```

### Step 2: Install Dependencies

Dependencies are already installed if you pulled the latest changes. If needed:

```bash
npm install
```

### Step 3: Initialize Neo4j Schema

```bash
# Initialize the graph schema and constraints
curl -X POST http://localhost:3000/api/neo4j/status \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

### Step 4: Populate Cultural Knowledge Graph

```bash
# Initialize with sample cultural data
curl -X POST http://localhost:3000/api/graph/init \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

### Step 5: Start the Application

```bash
npm run dev
```

Your enhanced GraphRAG-powered cultural assistant is now ready! 🎉

## 🗂️ Docker Services

### Updated docker-compose.yml

The updated stack now includes:

```yaml
services:
  weaviate: # Vector database (Phase 2)
    image: cr.weaviate.io/semitechnologies/weaviate:1.27.3
    ports: ["8080:8080", "50051:50051"]

  neo4j: # Graph database (Phase 3 - NEW!)
    image: neo4j:5.18-community
    ports: ["7474:7474", "7687:7687"]
    environment:
      NEO4J_AUTH: neo4j/password123
```

### Neo4j Browser Access

- **URL**: http://localhost:7474
- **Username**: `neo4j`
- **Password**: `password123`

## 📊 System Status Checks

### Check All Systems

```bash
# Check Neo4j status
curl http://localhost:3000/api/neo4j/status

# Check graph metrics
curl -X POST http://localhost:3000/api/neo4j/status \
  -H "Content-Type: application/json" \
  -d '{"action": "metrics"}'

# Check Weaviate (existing)
curl http://localhost:3000/api/weaviate/status
```

## 🔍 GraphRAG Query Examples

### 1. Basic Graph Search

```bash
# Semantic search in graph
curl -X GET "http://localhost:3000/api/graph/search?q=Diwali&type=semantic&limit=5"

# Hybrid search (vector + graph)
curl -X GET "http://localhost:3000/api/graph/search?q=Hindu%20festivals&type=hybrid&includeVector=true"
```

### 2. Advanced GraphRAG Queries

```bash
# Full GraphRAG with reasoning
curl -X POST http://localhost:3000/api/graph/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How are North Indian and South Indian festivals connected?",
    "type": "graphrag",
    "options": {
      "includeVector": true,
      "maxDepth": 3,
      "generateReasoning": true
    }
  }'
```

### 3. Graph Traversal

```bash
# Find related entities
curl -X POST http://localhost:3000/api/graph/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "traverse",
    "type": "traverse",
    "options": {
      "startNodeId": "1",
      "relationshipTypes": ["RELATED_TO", "ASSOCIATED_WITH"],
      "maxDepth": 2
    }
  }'
```

## 💬 Enhanced Chat Experience

The chat API now automatically uses GraphRAG when available:

### Chat Features

- **Automatic hybrid search** combining vector and graph results
- **Cultural relationship insights** in responses
- **Multi-hop reasoning** for complex questions
- **Enhanced context** with cultural connections
- **Fallback to vector search** if graph is unavailable

### Example Conversation

**User**: "Tell me about Diwali and its cultural significance"

**Enhanced Response**:

```
🧠 Enhanced with GraphRAG: I'm using advanced graph reasoning...

Based on my cultural knowledge graph, here's what I found about Diwali:

Diwali is the Festival of lights celebrated across India, symbolizing the victory
of light over darkness and good over evil.

**Cultural Connections:**
- Associated with deity: Lakshmi, Ganesha
- Celebrated in: Ayodhya (originated from)
- Associated with: Laddu, Kheer, Aarti, Rangoli
- Related to: Holi, Durga Puja

**Additional Insights:**
- Found 12 related cultural entities
- Discovered 8 relationships
- Connected across regions: All India, Uttar Pradesh
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   GraphRAG      │────│   Neo4j Graph   │
│   (Frontend)    │    │   Library       │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       └───────────────────────┤
         │                                               │
         └─────────────────┐    ┌─────────────────┐      │
                          │    │   Weaviate      │      │
                          │────│   Vector DB     │      │
                          │    │   (Phase 2)     │      │
                          │    └─────────────────┘      │
                          │                             │
                          └─────────────────────────────┘
                                    Hybrid Search
```

### Data Flow

1. **User Query** → Chat API
2. **GraphRAG Processing**:
   - Check Neo4j availability
   - Perform hybrid search (graph + vector)
   - Generate relationship insights
   - Create reasoning chains
3. **Enhanced Context** → Ollama LLM
4. **Enriched Response** → User

## 📈 Performance & Storage

### Resource Usage

| Component | RAM Usage | Storage    | Port        |
| --------- | --------- | ---------- | ----------- |
| Neo4j     | ~512MB    | ~500MB     | 7474, 7687  |
| Weaviate  | ~256MB    | ~100MB     | 8080, 50051 |
| Next.js   | ~200MB    | ~1GB       | 3000        |
| **Total** | **~1GB**  | **~1.6GB** |             |

### Storage Details

- **Neo4j data**: ~500MB (cultural graph + indexes)
- **Docker images**: ~500MB (neo4j:5.18-community)
- **Node dependencies**: ~15MB (neo4j-driver)
- **Application code**: ~5MB (GraphRAG libraries)

## 🎛️ Configuration

### Environment Variables

Create `.env.local` (optional):

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=neo4j

# GraphRAG Configuration
GRAPHRAG_MAX_DEPTH=3
GRAPHRAG_MAX_RESULTS=10
GRAPHRAG_CACHE_TIMEOUT=300000
GRAPHRAG_CONFIDENCE_THRESHOLD=0.7
```

### Customization

Edit `src/app/lib/graphrag.ts` to customize:

```typescript
const DEFAULT_GRAPHRAG_CONFIG: GraphRAGConfig = {
  maxTraversalDepth: 3, // How deep to traverse relationships
  maxResults: 10, // Max results per query
  enableCaching: true, // Enable query caching
  cacheTimeout: 300000, // Cache timeout (5 min)
  hybridSearchWeights: {
    graph: 0.6, // Graph search weight
    vector: 0.3, // Vector search weight
    text: 0.1, // Text search weight
  },
  reasoningDepth: 2, // Reasoning chain depth
  confidenceThreshold: 0.7, // Minimum confidence score
};
```

## 🔧 Management Commands

### Schema Management

```bash
# Initialize schema
curl -X POST http://localhost:3000/api/neo4j/status \
  -d '{"action": "initialize"}'

# View schema
curl -X POST http://localhost:3000/api/neo4j/status \
  -d '{"action": "schema"}'
```

### Data Management

```bash
# Add custom entity
curl -X POST http://localhost:3000/api/graph/init \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_entity",
    "entity": {
      "name": "Karva Chauth",
      "type": "festival",
      "description": "Hindu festival where wives fast for husbands well-being",
      "region": "North India",
      "category": "Hindu Festival"
    }
  }'

# Clear all data (⚠️ DESTRUCTIVE)
curl -X POST http://localhost:3000/api/neo4j/status \
  -d '{"action": "clear", "confirm": true}'
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Neo4j Connection Failed

```bash
# Check if Neo4j is running
docker ps | grep neo4j

# Check Neo4j logs
docker logs sahai-neo4j-1

# Restart Neo4j
docker-compose restart neo4j
```

#### 2. Memory Issues

```bash
# Check memory usage
docker stats

# Reduce Neo4j memory (edit docker-compose.yml)
NEO4J_dbms_memory_heap_max__size: 256m
NEO4J_dbms_memory_pagecache_size: 128m
```

#### 3. GraphRAG Not Working

```bash
# Check system status
curl http://localhost:3000/api/neo4j/status

# Verify data exists
curl -X POST http://localhost:3000/api/neo4j/status \
  -d '{"action": "metrics"}'

# Re-initialize if needed
curl -X POST http://localhost:3000/api/graph/init \
  -d '{"action": "initialize"}'
```

#### 4. Performance Issues

- **Reduce max depth**: Lower `maxTraversalDepth` in config
- **Enable caching**: Ensure `enableCaching: true`
- **Limit results**: Lower `maxResults` for faster queries
- **Index optimization**: Let Neo4j auto-create indexes

### Debug Mode

Enable detailed logging in `src/app/lib/graphrag.ts`:

```typescript
// Add to any function
console.log("GraphRAG Debug:", { query, results, timing });
```

## 🔄 Migration from Phase 2

### Automatic Migration

The system automatically:

- ✅ Detects Neo4j availability
- ✅ Falls back to vector search if needed
- ✅ Preserves existing Weaviate functionality
- ✅ Enhances responses when both available

### Manual Migration Steps

1. **Update Docker**: `docker-compose up -d`
2. **Install deps**: Already done in package.json
3. **Initialize**: Use API endpoints above
4. **Test**: Chat should show "🧠 Enhanced with GraphRAG"

## 📚 Advanced Usage

### Custom Cypher Queries

Direct Neo4j access through browser (http://localhost:7474):

```cypher
// Find most connected festivals
MATCH (f:CulturalEntity {type: 'festival'})-[r]-()
RETURN f.name, count(r) as connections
ORDER BY connections DESC

// Cultural influence paths
MATCH path = (a:CulturalEntity)-[:INFLUENCED_BY*1..3]-(b:CulturalEntity)
WHERE a.name = 'Diwali'
RETURN path

// Regional cultural clusters
MATCH (e:CulturalEntity)
WHERE e.region IS NOT NULL
RETURN e.region, collect(e.name) as entities
```

### API Integration Examples

#### Python

```python
import requests

# GraphRAG query
response = requests.post('http://localhost:3000/api/graph/search',
  json={
    'query': 'Hindu festivals and their regional variations',
    'type': 'graphrag',
    'options': {'includeVector': True, 'maxDepth': 2}
  })

result = response.json()
print(f"Found {len(result['context']['nodes'])} related entities")
```

#### JavaScript

```javascript
// Hybrid search
const response = await fetch("http://localhost:3000/api/graph/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "South Indian traditions",
    type: "hybrid",
    options: { includeVector: true, maxResults: 15 },
  }),
});

const data = await response.json();
console.log("Hybrid results:", data.combinedScore);
```

## 🎉 Success Criteria

Phase 3 is successfully implemented when:

- ✅ Neo4j database is running and accessible
- ✅ Cultural knowledge graph is populated with relationships
- ✅ GraphRAG queries return connected cultural insights
- ✅ Chat responses show "🧠 Enhanced with GraphRAG"
- ✅ Hybrid search combines vector and graph results
- ✅ System gracefully falls back to vector search if needed

## 🚀 Next Steps

Consider these Phase 4 enhancements:

- **Real-time cultural events** integration
- **User-generated cultural content** with verification
- **Advanced analytics** and cultural trend analysis
- **Multi-language graph** expansion beyond Hindi-English
- **Cultural recommendation engine** based on user interests

## 📞 Support

If you encounter issues:

1. **Check logs**: `docker logs` and browser console
2. **Verify connections**: Use status API endpoints
3. **Review setup**: Ensure all prerequisites are met
4. **Restart services**: `docker-compose restart`
5. **Re-initialize**: Use init APIs to reset data

---

**🎊 Congratulations!** You now have a sophisticated GraphRAG-powered cultural assistant that can understand and explain complex cultural relationships and connections!
