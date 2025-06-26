#!/bin/bash

# 🚀 Sahai AI - Automated Setup Script
# This script will help new team members set up the project quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}🤖 Sahai AI - Automated Setup${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Linux OS detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "macOS detected"
    else
        print_warning "OS not fully supported. Continuing anyway..."
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node --version) found"
        else
            print_error "Node.js version 18+ required. Found: $(node --version)"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm --version) found"
    else
        print_error "npm not found. Please install npm first."
        exit 1
    fi
    
    # Check RAM (Linux only)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$RAM_GB" -ge 8 ]; then
            print_success "RAM: ${RAM_GB}GB (sufficient)"
        else
            print_warning "RAM: ${RAM_GB}GB (8GB+ recommended)"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing npm dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Install Ollama
install_ollama() {
    print_info "Installing Ollama..."
    
    if command_exists ollama; then
        print_success "Ollama already installed: $(ollama --version)"
        return 0
    fi
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if curl -fsSL https://ollama.ai/install.sh | sh; then
            print_success "Ollama installed successfully"
        else
            print_error "Failed to install Ollama"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            if brew install ollama; then
                print_success "Ollama installed successfully"
            else
                print_error "Failed to install Ollama"
                exit 1
            fi
        else
            print_error "Homebrew not found. Please install Homebrew first or install Ollama manually."
            exit 1
        fi
    else
        print_warning "Please install Ollama manually from https://ollama.ai"
        return 0
    fi
}

# Download AI model
download_model() {
    print_info "Downloading Llama 3.2 3B model (~2.5GB)..."
    print_warning "This will take a while depending on your internet speed"
    
    # Start Ollama service if not running
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start ollama 2>/dev/null || true
    fi
    
    # Try different model names
    MODEL_NAMES=("llama3.2:3b" "llama3.2" "llama3")
    
    for MODEL in "${MODEL_NAMES[@]}"; do
        print_info "Trying to download model: $MODEL"
        if ollama pull "$MODEL"; then
            print_success "Model $MODEL downloaded successfully"
            
            # Update the model name in the config file
            if [[ "$MODEL" != "llama3.2:3b" ]]; then
                print_info "Updating model name in configuration..."
                sed -i.bak "s/llama3.2:3b/$MODEL/g" src/app/api/chat/route.ts
                print_success "Configuration updated to use $MODEL"
            fi
            
            return 0
        else
            print_warning "Failed to download $MODEL, trying next..."
        fi
    done
    
    print_error "Failed to download any model"
    exit 1
}

# Test installation
test_installation() {
    print_info "Testing installation..."
    
    # Test Ollama
    if ollama list | grep -q "llama"; then
        print_success "Ollama model available"
    else
        print_error "No Ollama model found"
        exit 1
    fi
    
    # Test model response
    print_info "Testing model response..."
    if ollama run llama3.2:3b "Hello" --timeout 30 >/dev/null 2>&1; then
        print_success "Model responding correctly"
    else
        print_warning "Model test failed, but continuing..."
    fi
}

# Setup development environment
setup_dev_environment() {
    print_info "Setting up development environment..."
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        cat > .env.local << EOF
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=llama3.2:3b

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=Sahai AI
EOF
        print_success "Environment file created"
    fi
    
    # Create .gitignore entries
    if ! grep -q ".env.local" .gitignore 2>/dev/null; then
        echo ".env.local" >> .gitignore
        print_success "Updated .gitignore"
    fi
}

# Start services
start_services() {
    print_info "Starting services..."
    
    # Start Ollama service
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if sudo systemctl start ollama; then
            print_success "Ollama service started"
        else
            print_warning "Failed to start Ollama service. You may need to start it manually."
        fi
    fi
    
    print_info "Starting Next.js development server..."
    print_warning "This will start the server in the background"
    
    # Start Next.js in background
    nohup npm run dev > dev.log 2>&1 &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Next.js server started successfully"
        print_info "Server running at: http://localhost:3000"
        print_info "Process ID: $DEV_PID"
        echo "$DEV_PID" > .next-dev-pid
    else
        print_error "Failed to start Next.js server"
        exit 1
    fi
}

# Final instructions
print_final_instructions() {
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Open your browser to: http://localhost:3000"
    echo "2. Check that status shows 'Connected to Ollama'"
    echo "3. Try sending a message: 'नमस्ते, आप कैसे हैं?'"
    echo
    echo -e "${BLUE}To stop the services:${NC}"
    echo "• Stop Next.js: kill \$(cat .next-dev-pid)"
    echo "• Stop Ollama: sudo systemctl stop ollama"
    echo
    echo -e "${BLUE}To restart everything:${NC}"
    echo "• Run: ./setup.sh --restart"
    echo
    echo -e "${BLUE}For troubleshooting:${NC}"
    echo "• Check the README.md file"
    echo "• View logs: tail -f dev.log"
    echo
    echo -e "${YELLOW}Happy coding! 🚀${NC}"
}

# Handle command line arguments
case "${1:-}" in
    --restart)
        print_header
        print_info "Restarting services..."
        
        # Stop existing services
        if [ -f ".next-dev-pid" ]; then
            kill "$(cat .next-dev-pid)" 2>/dev/null || true
            rm .next-dev-pid
        fi
        
        start_services
        print_success "Services restarted"
        ;;
    --help|-h)
        print_header
        echo "Usage: ./setup.sh [OPTIONS]"
        echo
        echo "Options:"
        echo "  --restart    Restart the development services"
        echo "  --help, -h   Show this help message"
        echo
        echo "Run without arguments to perform full setup"
        ;;
    *)
        # Full setup
        print_header
        
        print_info "Starting automated setup for Sahai AI..."
        echo
        
        check_requirements
        install_dependencies
        install_ollama
        download_model
        test_installation
        setup_dev_environment
        start_services
        
        print_final_instructions
        ;;
esac 