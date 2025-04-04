# Llama 3.2 Specifications and Capabilities Research

## Model Overview

Llama 3.2 is a collection of multilingual large language models (LLMs) released by Meta on September 25, 2024. The collection includes:

1. **Text-only models**:
   - 1B (1.23B parameters)
   - 3B (3.21B parameters)
   - Optimized for on-device use cases

2. **Vision models**:
   - 11B parameters
   - 90B parameters
   - Support image reasoning use cases

## Key Specifications

### Context Length
- All Llama 3.2 models support a 128K token context length
- Quantized models have reduced context length of 8K tokens

### Architecture
- Auto-regressive language model using optimized transformer architecture
- Grouped-Query Attention (GQA) for improved inference scalability
- For vision models: adapter weights integrate pre-trained image encoder into pre-trained language model
- Shared embeddings across models

### Training Methodology
- Pre-trained on up to 9T tokens from publicly available online data
- Knowledge cutoff: December 2023
- For 1B and 3B models: incorporated logits from Llama 3.1 8B and 70B models as token-level targets
- Knowledge distillation used after pruning to recover performance
- Post-training alignment through:
  - Supervised Fine-Tuning (SFT)
  - Rejection Sampling (RS)
  - Direct Preference Optimization (DPO)

### Supported Languages
- Officially supported: English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai
- Trained on broader collection of languages beyond these 8
- Developers can fine-tune for additional languages with proper compliance

### Performance Benchmarks
- Vision models competitive with leading foundation models like Claude 3 Haiku and GPT4o-mini
- 3B model outperforms Gemma 2 2.6B and Phi 3.5-mini on tasks like instruction following, summarization, prompt rewriting, and tool-use
- 1B model competitive with Gemma
- Evaluated on over 150 benchmark datasets spanning multiple languages

### Quantization
- 4-bit groupwise scheme (group size of 32) for weights in linear layers
- 8-bit per-token dynamic quantization for activations
- Optimized for PyTorch's ExecuTorch inference framework and Arm CPU backend

## Capabilities

### Text-only Models (1B and 3B)
- Multilingual text generation
- Tool calling abilities
- On-device agentic applications with strong privacy
- Summarization, instruction following, and rewriting tasks
- Personalized applications where data never leaves the device

### Vision Models (11B and 90B)
- Document-level understanding including charts and graphs
- Image captioning
- Visual grounding tasks (directionally pinpointing objects in images)
- Reasoning based on visual information (e.g., analyzing graphs, maps)
- Bridging gap between vision and language

## Fine-tuning Capabilities
- Models can be fine-tuned for custom applications
- Pre-trained and aligned models available for fine-tuning
- Can use torchtune for fine-tuning
- Can be deployed locally using torchchat
- Supports fine-tuning for languages beyond officially supported ones

## Deployment Options
- Available through Llama Stack distributions
- Supports single-node, on-prem, cloud, and on-device environments
- Enables turnkey deployment of retrieval-augmented generation (RAG)
- Integrated safety features
- On-device distribution via PyTorch ExecuTorch
- Single-node distribution via Ollama
- Available on partner platforms including AMD, AWS, Databricks, Dell, Google Cloud, Groq, IBM, Intel, Microsoft Azure, NVIDIA, Oracle Cloud, and Snowflake

## Training Resources Used
- Total training utilized 916k GPU hours on H100-80GB hardware
- Llama 3.2 1B: 370k GPU hours
- Llama 3.2 3B: 460k GPU hours
- Additional hours for quantization and fine-tuning

## Licensing
- Use governed by the Llama 3.2 Community License (a custom, commercial license agreement)
