# Phase 2 - RAG Integration Setup Guide

## Overview

Phase 2 adds RAG (Retrieval-Augmented Generation) capabilities to your cultural assistant with:

- ✅ Weaviate vector database integration
- ✅ Cultural knowledge base
- ✅ Document upload support
- ✅ Advanced search capabilities

## Prerequisites

- Phase 1 completed and running
- Docker and Docker Compose installed
- Node.js 18+ and npm

## Quick Start

### 1. Start Weaviate Database

```bash
# Start Weaviate using Docker Compose
docker-compose up -d

# Verify Weaviate is running
curl http://localhost:8080/v1/.well-known/ready
```

### 2. Install Dependencies

Dependencies are already installed from previous setup. If needed:

```bash
npm install
```

### 3. Initialize Weaviate Schema

```bash
# Initialize the cultural knowledge schema
curl -X POST http://localhost:3000/api/weaviate/status \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

### 4. Start the Application

```bash
npm run dev
```

## API Endpoints

### Document Upload

- **POST** `/api/documents/upload`
- **GET** `/api/documents/upload` - Get upload guidelines

### Vector Search

- **POST** `/api/search`
- **GET** `/api/search?q=query&category=festival&limit=10`

### Weaviate Status

- **GET** `/api/weaviate/status` - Check connection and status
- **POST** `/api/weaviate/status` - Initialize schema

### Enhanced Chat

- **POST** `/api/chat` - Now includes RAG context

## Features Added

### 1. Document Upload

- Support for PDF, DOC, DOCX, TXT, MD files
- Automatic text extraction and chunking
- Vector embedding generation
- Drag-and-drop interface

### 2. Vector Search

- Semantic search across cultural knowledge
- Category, region, and language filters
- Combined results from knowledge base and documents
- Relevance scoring

### 3. Enhanced Chat

- RAG-powered responses with context
- Cultural knowledge integration
- Source attribution
- Improved accuracy for cultural queries

### 4. Advanced Search UI

- Filter by category, region, language
- Real-time search with instant results
- Result type indicators
- Search statistics

## File Structure

```
src/app/
├── api/
│   ├── chat/route.ts (Enhanced with RAG)
│   ├── documents/upload/route.ts (New)
│   ├── search/route.ts (New)
│   └── weaviate/status/route.ts (New)
├── components/
│   ├── DocumentUpload.tsx (New)
│   ├── AdvancedSearch.tsx (New)
│   ├── Chat.tsx (Existing)
│   ├── ChatInput.tsx (Existing)
│   └── ChatMessage.tsx (Existing)
├── lib/
│   ├── weaviate.ts (New)
│   └── fileProcessor.ts (New)
├── types/
│   ├── vector.ts (New)
│   ├── chat.ts (Existing)
│   └── pdf-parse.d.ts (New)
└── ...
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
WEAVIATE_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Docker Compose

The `docker-compose.yml` includes:

- Weaviate vector database
- Persistent data volumes
- Health checks
- Module configurations

## Testing the Integration

### 1. Test Weaviate Connection

```bash
curl http://localhost:3000/api/weaviate/status
```

### 2. Test Document Upload

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@sample.pdf" \
  -F "category=festival"
```

### 3. Test Vector Search

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "diwali festival", "options": {"category": "festival", "limit": 5}}'
```

### 4. Test Enhanced Chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Diwali celebrations"}'
```

## Usage Examples

### Document Upload Component

```tsx
import { DocumentUpload } from "./components/DocumentUpload";

function App() {
  return (
    <DocumentUpload
      onUploadComplete={(file) => console.log("Uploaded:", file)}
      onUploadError={(error) => console.error("Error:", error)}
    />
  );
}
```

### Advanced Search Component

```tsx
import { AdvancedSearch } from "./components/AdvancedSearch";

function App() {
  return (
    <AdvancedSearch
      onSearchResults={(results, query) => console.log("Results:", results)}
      onSearchError={(error) => console.error("Error:", error)}
    />
  );
}
```

## Cultural Knowledge Categories

- **festival** - Indian festivals and celebrations
- **food** - Traditional cuisine and recipes
- **custom** - Cultural customs and practices
- **tradition** - Traditional ceremonies and rituals
- **language** - Language information and usage
- **mythology** - Stories and mythological content
- **art** - Art forms and crafts
- **dance** - Traditional dance forms
- **music** - Classical and folk music
- **other** - Other cultural content

## Troubleshooting

### Weaviate Connection Issues

```bash
# Check if Weaviate is running
docker-compose ps

# Restart Weaviate
docker-compose restart weaviate

# Check logs
docker-compose logs weaviate
```

### Upload Issues

- Verify file size < 10MB
- Check supported formats: PDF, DOC, DOCX, TXT, MD
- Ensure proper file encoding

### Search Issues

- Initialize schema if not done
- Check Weaviate connection
- Verify data is indexed

## Next Steps

After Phase 2 is working:

1. **Add more cultural data** to the knowledge base
2. **Test with various document types**
3. **Experiment with search filters**
4. **Prepare for Phase 3 (GraphRAG)**

## Support

- Check API endpoint responses for detailed error messages
- Monitor browser console for frontend errors
- Use Docker logs for Weaviate issues
- Verify all dependencies are installed

## Phase 3 Preview

Phase 3 will add:

- Neo4j graph database
- GraphRAG capabilities
- Relationship queries
- Social network analysis
- Complex reasoning

Stay tuned for Phase 3 implementation guide!
