# Sahai - AI Companion for India (Phase 1)
<img width="1883" height="910" alt="Sahai AI" src="https://github.com/user-attachments/assets/cd714c35-f6c6-4497-ad44-b8232487ed85" />
<img width="1859" height="910" alt="Screenshot 2025-07-19 123412" src="https://github.com/user-attachments/assets/ca82d10c-1ab7-437f-b57e-7b32d1b07adb" />

## 📖 Overview

**Sahai** is a culturally aware AI companion tailored for the Indian market, offering intelligent voice and text assistance. Developed as a Minimum Viable Product (MVP) over a 1-2 month period, Sahai Phase 1 leverages open-source Large Language Models (LLMs) to provide:

- Natural language conversation
- Cultural context understanding
- Bilingual support (Hindi and English)

The system is deployed as:

- A mobile application (iOS and Android) (Coming Soon)
- A progressive web app (PWA)
- An API service for future integrations

---

## 🚀 Key Features

- **Natural Language Conversation**  
  Supports Hindi, English, and code-switching with culturally appropriate responses  
  (`REQ-CF-001`)

- **Cultural Context Awareness**  
  Understands Indian festivals, customs, food preferences, and regional nuances  
  (`REQ-CF-002`)

- **Voice Interaction**  
  Speech-to-text and text-to-speech with Indian accent support and male/female voice options  
  (`REQ-VI-001`, `REQ-VI-002`)

- **Local Information Retrieval**  
  Provides weather, news, and general knowledge tailored to Indian users  
  (`REQ-IR-001`, `REQ-IR-002`)

- **Personalization**  
  Adapts to user preferences, location, and conversation patterns  
  (`REQ-PE-001`, `REQ-PE-002`)

- **Privacy-Focused**  
  Complies with Indian data protection laws, AES-256 encryption, and user-controlled data retention  
  (`REQ-NF-003`, `REQ-NF-004`)

---

## 📦 Project Details

- **Version**: 1.0
- **Development Timeline**: May 23, 2025 – July 19, 2025
- **Prepared By**: Development Team
- **License**: Coming Soon 

---

## 🛠️ System Requirements

### Client Environment

- **Web**: Chrome 90+, Safari 14+, Firefox 88+
- **Hardware**: 2GB+ RAM
- **Connectivity**: 3G/4G/WiFi

### Server Environment

- **Orchestration**: Docker
- **Databases**: Redis, Weaviate (vector DB), Neo4j (graph DB)
- **LLM**: Llama 3.2 3B (fallback: Llama 2 7B or Mistral 7B)
- **Hardware**: 6GB+ RAM, 6GB VRAM (GPU), ~2.5GB disk space

---

## 🧪 Installation

### Prerequisites

- Node.js 18.x+
- Docker (latest)
- Ollama
- OS: Ubuntu 22.04 / WSL2 (Windows)

---

## 🖥️ Local Setup

### Clone the Repository

```bash
git clone https://github.com/<your-organization>/sahai.git
cd sahai
```

### Install Ollama

**Ubuntu/WSL2**:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Mac**:

```bash
brew install ollama
```

### Start Ollama

```bash
ollama serve
ollama pull llama3.2:3b
ollama list
ollama run llama3.2:3b "Hello, how are you?"
```

### Start Core Services

```bash
sudo service docker start
docker-compose up -d
```

**Verify Services:**

```bash
docker ps
curl http://localhost:8080/v1/meta
sudo systemctl is-active ollama
```

---


**Initialize Weaviate & Neo4j:**

```bash
curl -X POST http://localhost:3000/api/weaviate/status -d '{"action": "initialize"}' -H "Content-Type: application/json"
curl -X POST http://localhost:3000/api/neo4j/status -d '{"action": "initialize"}' -H "Content-Type: application/json"
```

**Populate Cultural Data:**

```bash
node scripts/populate-cultural-data.js
curl -X POST http://localhost:3000/api/graph/init -H "Content-Type: application/json"
```

---

### Start Frontend

#### Web App (Next.js)

```bash
cd web
npm install
npm run dev   # Available at http://localhost:3000
```

---

### ✅ Verify System

```bash
curl -X POST http://localhost:3000/api/search -d '{"query": "Diwali"}' -H "Content-Type: application/json"
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧯 Troubleshooting

### Ollama Issues

```bash
sudo systemctl status ollama
sudo systemctl restart ollama
curl http://localhost:11434
```

### Weaviate Issues

```bash
docker logs weaviate
docker-compose restart weaviate
```

### Next.js Issues

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Missing Cultural Data

```bash
node scripts/populate-cultural-data.js
```

---

## 🛑 Stopping the System

### Graceful Shutdown

```bash
# Stop frontend (Ctrl+C)
docker-compose down
sudo systemctl stop ollama
sudo service docker stop
```

### Full Cleanup

```bash
docker-compose down -v
docker system prune -f
```

---

## 💡 Usage

- **Mobile App**: Run locally or install from app stores post-launch
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API**: Use REST API at `/api/v1/` (see below)

---

## ✨ Example Interactions

- **Text**:
  _"Mujhe Holi ke liye traditional Gujarati recipe batao."_

- **Voice**:
  Press mic and say _"What’s the weather in Delhi today?"_

- **Settings**:
  Choose language, voice, and cultural preferences

---

## 📘 API Documentation

**Base URL:** `/api/v1/`

### Endpoints

- `POST /auth/register` – Register via email/phone/social
- `POST /chat` – Send messages (text/voice)
- `GET /info/weather` – Get weather info
- `GET /user/profile` – Fetch preferences and history

**Auth:** JWT (24hr expiry)
**Rate Limit:** 100 req/min/user
📄 Full API docs: `docs/api.md`
