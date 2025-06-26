# 🤝 Contributing to Sahai AI

Welcome to Sahai AI! We're excited to have you contribute to our multilingual chatbot project. This guide will help you get started with contributing.

## 🚀 Quick Start

### For New Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/sahai-ai.git
   cd sahai-ai
   ```
3. **Run the automated setup**:
   ```bash
   ./setup.sh
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### For Existing Contributors

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```
2. **Update dependencies**:
   ```bash
   npm install
   ```
3. **Start development**:
   ```bash
   ./setup.sh --restart
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Format code consistently
- **Comments**: Add meaningful comments for complex logic
- **Testing**: Write tests for new features

### Git Workflow

1. **Branch naming**:

   - Features: `feature/short-description`
   - Bug fixes: `bugfix/short-description`
   - Documentation: `docs/short-description`
   - Chores: `chore/short-description`

2. **Commit messages**:

   ```
   type(scope): short description

   Longer description if needed

   - Additional details
   - Any breaking changes
   ```

3. **Examples**:
   ```
   feat(chat): add voice input support
   fix(ui): resolve message bubble alignment
   docs(readme): update installation instructions
   chore(deps): update dependencies
   ```

### Pull Request Process

1. **Create a descriptive PR title**
2. **Fill out the PR template**
3. **Include screenshots** for UI changes
4. **Test in both Hindi and English**
5. **Update documentation** if needed
6. **Request review** from maintainers

## 🧪 Testing

### Manual Testing

Before submitting a PR, test:

1. **Basic functionality**:

   - Chat interface loads correctly
   - Messages send and receive properly
   - Connection status updates

2. **Language support**:

   - English: "Tell me about Indian festivals"
   - Hindi: "भारत के त्योहारों के बारे में बताइए"
   - Code-switching: "मैं English और Hindi mix करता हूं"

3. **Error handling**:

   - Stop Ollama service
   - Test error messages
   - Check connection retry

4. **Performance**:
   - Response time under 60 seconds
   - Memory usage reasonable
   - No memory leaks

### Automated Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when available)
npm run test

# Check build
npm run build
```

## 🌟 What We're Looking For

### High Priority

- **Bug fixes** for existing issues
- **Performance improvements**
- **Better error handling**
- **UI/UX enhancements**
- **Documentation improvements**

### Medium Priority

- **New language support**
- **Additional AI models**
- **Integration improvements**
- **Testing framework**

### Future Features

- **Phase 2**: RAG integration
- **Phase 3**: GraphRAG implementation
- **Phase 4**: Cultural fine-tuning
- **Voice input/output**
- **Mobile responsiveness**

## 🎯 Contribution Areas

### 1. Frontend (React/Next.js)

- **Components**: Chat interface, message bubbles
- **Styling**: TailwindCSS improvements
- **Responsive design**: Mobile optimization
- **Accessibility**: ARIA labels, keyboard navigation

### 2. Backend (API Routes)

- **Chat API**: Message processing, error handling
- **Health checks**: Service monitoring
- **Performance**: Response time optimization
- **Security**: Input validation, rate limiting

### 3. AI Integration

- **Model management**: Different model support
- **Prompt engineering**: Better system prompts
- **Context handling**: Conversation memory
- **Fallback systems**: Multiple model support

### 4. Documentation

- **README updates**: Installation improvements
- **API documentation**: Endpoint descriptions
- **Troubleshooting**: Common issues
- **Examples**: Code samples

### 5. DevOps

- **Setup scripts**: Installation automation
- **Docker support**: Containerization
- **CI/CD**: Automated testing
- **Performance monitoring**: Metrics collection

## 🐛 Bug Reports

When reporting bugs, include:

1. **System information**:

   - OS version
   - Node.js version
   - Browser (if applicable)
   - RAM/GPU specifications

2. **Steps to reproduce**:

   - Exact commands run
   - User inputs
   - Expected vs actual behavior

3. **Error messages**:

   - Console output
   - Error logs
   - Screenshots

4. **Environment details**:
   - Ollama version
   - Model name
   - Service status

## 💡 Feature Requests

For new features, provide:

1. **Use case**: Why is this needed?
2. **User story**: As a user, I want...
3. **Acceptance criteria**: What defines success?
4. **Technical considerations**: Implementation ideas
5. **Priority**: How important is this?

## 🌐 Multilingual Considerations

### Language Support

- **Primary**: Hindi, English
- **Code-switching**: Natural mixing of languages
- **Cultural context**: Indian cultural references
- **Festivals**: Hindu, Muslim, Sikh, Christian celebrations

### Testing Different Languages

```bash
# Test Hindi
"नमस्ते! आप कैसे हैं?"

# Test English
"Hello! How are you?"

# Test code-switching
"Hi, मैं आपसे बात करना चाहता हूं about Indian festivals"

# Test cultural context
"दिवाली के बारे में बताइए"
```

### Cultural Sensitivity

- **Religious neutrality**: Respect all faiths
- **Regional diversity**: Consider different Indian regions
- **Festival accuracy**: Correct information about celebrations
- **Language respect**: Proper Hindi transliteration

## 📱 Platform Considerations

### Desktop

- **Windows**: WSL2 support
- **macOS**: Native support
- **Linux**: Primary development platform

### Mobile (Future)

- **Responsive design**: Mobile-first approach
- **Touch interactions**: Gesture support
- **Performance**: Optimized for mobile devices

## 🔧 Development Tools

### Recommended Extensions (VS Code)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues

# Ollama
ollama serve            # Start Ollama server
ollama list             # List installed models
ollama pull model-name  # Download model
ollama run model-name   # Test model

# Git
git status              # Check status
git add .               # Stage changes
git commit -m "message" # Commit changes
git push origin branch  # Push to remote
```

## 🎉 Recognition

### Contributors

All contributors will be:

- **Listed** in the project contributors
- **Mentioned** in release notes
- **Credited** for their specific contributions
- **Invited** to join the core team (for significant contributions)

### Contribution Types

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation**
- 🎨 **UI/UX improvements**
- 🔧 **DevOps & tooling**
- 🌐 **Translations**
- 🧪 **Testing**

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Reviews**: Code feedback
- **Documentation**: Check README.md first

### Response Times

- **Issues**: 24-48 hours
- **Pull Requests**: 2-3 days
- **Questions**: 1-2 days
- **Urgent bugs**: Same day

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

### Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly for new features
- **Major releases**: Quarterly for significant updates

---

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive. We welcome contributors from all backgrounds and experience levels.

**Thank you for contributing to Sahai AI!** 🙏

---

_Made with ❤️ for the Indian AI community_
