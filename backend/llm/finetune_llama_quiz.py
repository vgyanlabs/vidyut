#!/usr/bin/env python3
"""
Script to fine-tune Llama 3.2 on quiz generation data using DeepSeek's distillation approach.
This script is designed to run on Google Colab's free tier.

Usage:
    python finetune_llama_quiz.py [--model_size SIZE] [--data_path PATH] [--output_dir PATH]

Requirements:
    - torch
    - transformers
    - peft
    - accelerate
    - bitsandbytes
    - trl
"""

import os
import json
import argparse
import torch
import numpy as np
from pathlib import Path
from tqdm import tqdm
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import (
    prepare_model_for_kbit_training,
    LoraConfig,
    get_peft_model,
    PeftModel
)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Fine-tune Llama 3.2 for quiz generation")
    parser.add_argument("--model_size", type=str, default="1B", choices=["1B", "3B"],
                        help="Size of Llama 3.2 model to use")
    parser.add_argument("--data_path", type=str, default="./processed_data",
                        help="Path to the processed data directory")
    parser.add_argument("--output_dir", type=str, default="./finetuned_model",
                        help="Directory to save the fine-tuned model")
    parser.add_argument("--epochs", type=int, default=3,
                        help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=4,
                        help="Batch size for training")
    parser.add_argument("--learning_rate", type=float, default=2e-4,
                        help="Learning rate for training")
    return parser.parse_args()

def load_tokenized_dataset(data_path, tokenizer, max_length=512):
    """
    Load and tokenize the dataset.
    
    Args:
        data_path (str): Path to the data directory
        tokenizer: Tokenizer to use
        max_length (int): Maximum sequence length
        
    Returns:
        dict: Dictionary containing tokenized datasets
    """
    print(f"Loading dataset from {data_path}")
    
    # Check if data_path is a directory or a file
    if os.path.isdir(data_path):
        train_path = os.path.join(data_path, "train.jsonl")
        val_path = os.path.join(data_path, "validation.jsonl")
    else:
        train_path = data_path
        val_path = None
    
    # Load the datasets
    train_dataset = load_dataset("json", data_files=train_path, split="train")
    if val_path and os.path.exists(val_path):
        val_dataset = load_dataset("json", data_files=val_path, split="train")
    else:
        # If no validation set, use a small portion of the training set
        train_val = train_dataset.train_test_split(test_size=0.1)
        train_dataset = train_val["train"]
        val_dataset = train_val["test"]
    
    print(f"Loaded {len(train_dataset)} training examples and {len(val_dataset)} validation examples")
    
    # Define tokenization function
    def tokenize_function(examples):
        # Combine prompt and completion for training
        texts = [
            f"{prompt}\n{completion}" 
            for prompt, completion in zip(examples["prompt"], examples["completion"])
        ]
        
        # Tokenize the texts
        tokenized = tokenizer(
            texts,
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        )
        
        # Set the labels to be the same as the input_ids
        tokenized["labels"] = tokenized["input_ids"].clone()
        
        return tokenized
    
    # Tokenize the datasets
    print("Tokenizing datasets...")
    tokenized_train = train_dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=["prompt", "completion"]
    )
    tokenized_val = val_dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=["prompt", "completion"]
    )
    
    return {
        "train": tokenized_train,
        "validation": tokenized_val
    }

def setup_model_and_tokenizer(model_size):
    """
    Set up the model and tokenizer for fine-tuning.
    
    Args:
        model_size (str): Size of the model to use ("1B" or "3B")
        
    Returns:
        tuple: (model, tokenizer)
    """
    print(f"Setting up Llama 3.2 {model_size} model and tokenizer...")
    
    # Define model name based on size
    model_name = f"meta-llama/Llama-3.2-{model_size}"
    
    # Set up quantization config for 4-bit training
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token
    
    # Load model with quantization
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto"
    )
    
    # Prepare model for k-bit training
    model = prepare_model_for_kbit_training(model)
    
    # Set up LoRA configuration
    lora_config = LoraConfig(
        r=16,                    # Rank
        lora_alpha=32,           # Alpha parameter for LoRA scaling
        lora_dropout=0.05,       # Dropout probability for LoRA layers
        bias="none",             # Bias type
        task_type="CAUSAL_LM",   # Task type
        target_modules=[         # Target modules for LoRA
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ]
    )
    
    # Apply LoRA to the model
    model = get_peft_model(model, lora_config)
    
    # Print trainable parameters
    model.print_trainable_parameters()
    
    return model, tokenizer

def train_model(model, tokenizer, datasets, args):
    """
    Train the model using the provided datasets.
    
    Args:
        model: Model to train
        tokenizer: Tokenizer to use
        datasets (dict): Dictionary containing tokenized datasets
        args: Command line arguments
        
    Returns:
        model: Trained model
    """
    print("Setting up training arguments...")
    
    # Set up training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_dir=f"{args.output_dir}/logs",
        logging_steps=10,
        learning_rate=args.learning_rate,
        weight_decay=0.01,
        fp16=True,
        bf16=False,
        max_grad_norm=0.3,
        max_steps=-1,
        warmup_ratio=0.03,
        group_by_length=True,
        lr_scheduler_type="cosine",
        report_to="none"
    )
    
    # Set up data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
    
    # Set up trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=datasets["train"],
        eval_dataset=datasets["validation"],
        data_collator=data_collator
    )
    
    # Train the model
    print("Starting training...")
    trainer.train()
    
    # Save the model
    print(f"Saving model to {args.output_dir}")
    trainer.save_model(args.output_dir)
    
    return model

def main():
    """Main function to fine-tune Llama 3.2 for quiz generation."""
    args = parse_args()
    
    # Create output directory if it doesn't exist
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Set up model and tokenizer
    model, tokenizer = setup_model_and_tokenizer(args.model_size)
    
    # Load and tokenize dataset
    datasets = load_tokenized_dataset(args.data_path, tokenizer)
    
    # Train the model
    model = train_model(model, tokenizer, datasets, args)
    
    print(f"Fine-tuning complete! Model saved to {args.output_dir}")

if __name__ == "__main__":
    main()
