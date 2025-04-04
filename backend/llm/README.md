# Data Collection and Preprocessing Scripts

This directory contains scripts for collecting, preprocessing, fine-tuning, and generating quiz questions using Llama 3.2 with DeepSeek's distillation approach.

## Scripts Overview

1. **download_trivia_dataset.py**: Downloads the Open Trivia Database dataset from Kaggle
2. **preprocess_trivia_dataset.py**: Preprocesses the dataset into prompt-completion pairs for fine-tuning
3. **finetune_llama_quiz.py**: Fine-tunes Llama 3.2 on quiz generation data using DeepSeek's distillation approach
4. **generate_quiz.py**: Generates quiz questions using the fine-tuned model

## Usage Instructions

### 1. Download Dataset

```bash
python download_trivia_dataset.py
```

This script:
- Downloads the Open Trivia Database dataset from Kaggle
- Requires Kaggle API credentials to be set up
- Explores the dataset and prints basic information

### 2. Preprocess Dataset

```bash
python preprocess_trivia_dataset.py --input_path /path/to/dataset --output_dir ./processed_data
```

This script:
- Loads the Open Trivia Database dataset
- Formats it into prompt-completion pairs suitable for fine-tuning
- Creates two types of examples: single questions and multiple questions grouped by category
- Splits the data into training and validation sets
- Saves the processed data in JSONL format

### 3. Fine-tune Llama 3.2

```bash
python finetune_llama_quiz.py --model_size 1B --data_path ./processed_data --output_dir ./finetuned_model
```

This script:
- Fine-tunes Llama 3.2 on the preprocessed quiz generation data
- Uses Parameter-Efficient Fine-Tuning (PEFT) with LoRA
- Supports 1B and 3B model sizes
- Optimized for Google Colab's free tier with 4-bit quantization

### 4. Generate Quiz Questions

```bash
python generate_quiz.py --model_path ./finetuned_model --num_questions 5 --category "Science" --difficulty "medium"
```

This script:
- Generates quiz questions using the fine-tuned model
- Supports different categories and difficulty levels
- Can generate single or multiple questions
- Saves the generated questions in JSON format

## Requirements

- Python 3.7+
- torch
- transformers
- peft
- accelerate
- bitsandbytes
- trl
- pandas
- numpy
- tqdm
- kagglehub (for downloading the dataset)

## Notes

- These scripts are designed to work together in sequence
- The fine-tuning script is optimized for Google Colab's free tier
- For best results, use the 1B model on Google Colab's free tier
- The scripts include error handling and detailed documentation
