# Sahai-P1
# Sahai-P1 — LLaMA 3.2B Local Setup (macOS)

This repository sets up and runs the LLaMA 3.2B Instruct model locally using the GGUF format, optimized for Apple Silicon (M1/M2/M3) on macOS.

## Folder Structure

Sahai-P1/
├── llama-setup/
│ ├── bin/ # Compiled binaries
│ ├── models/ # Place model file here
│ └── tools/ # Supporting tools and scripts
├── README.md

markdown
Copy
Edit

## Requirements

- macOS with Apple Silicon (M1/M2/M3)
- Xcode Command Line Tools
- CMake and Make
- Git (optional: Git LFS if using large model files)

## Build Instructions

1. Clone the llama.cpp repository (already included in `llama-setup`)
2. Open a terminal and run:

```bash
cd llama-setup
mkdir build && cd build
cmake ..
make -j
Download the Model
Place the model file in the models directory:

bash
Copy
Edit
cd llama-setup/models
curl -LO https://huggingface.co/TheBloke/Llama-3.2B-Instruct-GGUF/resolve/main/Llama-3.2B-Instruct-Q4_K_M.gguf
Run the Model
Run a basic prompt using the CLI tool:

bash
Copy
Edit
./bin/llama-cli \
  -m llama-setup/models/Llama-3.2B-Instruct-Q4_K_M.gguf \
  -p "Hello, who are you?"
Notes
Uses Metal backend for optimized performance on macOS

The .gguf model format is compact and efficient

Avoid pushing large model files directly to Git without LFS

Git LFS Setup (Optional)
To manage the model file with Git LFS:

bash
Copy
Edit
git lfs install
git lfs track "*.gguf"
git add .gitattributes
git add llama-setup/models/Llama-3.2B-Instruct-Q4_K_M.gguf
git commit -m "Add model file"
git push origin main


Maintainer
Shubham Negi — github.com/Ainrion

