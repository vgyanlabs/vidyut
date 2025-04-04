#!/usr/bin/env python3
"""
Script to generate quiz questions using a fine-tuned Llama 3.2 model.

Usage:
    python generate_quiz.py [--model_path PATH] [--num_questions NUM] [--category CATEGORY] [--output_file PATH]

Requirements:
    - torch
    - transformers
    - peft
"""

import os
import json
import argparse
import torch
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from peft import PeftModel

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Generate quiz questions using fine-tuned Llama 3.2")
    parser.add_argument("--model_path", type=str, default="./finetuned_model",
                        help="Path to the fine-tuned model")
    parser.add_argument("--base_model", type=str, default="meta-llama/Llama-3.2-1B",
                        help="Base model name")
    parser.add_argument("--num_questions", type=int, default=5,
                        help="Number of questions to generate")
    parser.add_argument("--category", type=str, default="General Knowledge",
                        help="Category for quiz questions")
    parser.add_argument("--difficulty", type=str, default="medium", 
                        choices=["easy", "medium", "hard"],
                        help="Difficulty level for questions")
    parser.add_argument("--output_file", type=str, default="generated_quiz.json",
                        help="Path to save generated questions")
    parser.add_argument("--temperature", type=float, default=0.7,
                        help="Temperature for generation")
    parser.add_argument("--max_new_tokens", type=int, default=256,
                        help="Maximum number of tokens to generate")
    return parser.parse_args()

def load_model_and_tokenizer(args):
    """
    Load the fine-tuned model and tokenizer.
    
    Args:
        args: Command line arguments
        
    Returns:
        tuple: (model, tokenizer)
    """
    print(f"Loading model from {args.model_path}")
    
    # Check if model_path exists and is a directory
    if not os.path.exists(args.model_path):
        print(f"Model path {args.model_path} does not exist.")
        print(f"Using base model {args.base_model} instead.")
        model_path = args.base_model
        is_peft_model = False
    else:
        model_path = args.model_path
        # Check if this is a PEFT model
        adapter_config_path = os.path.join(model_path, "adapter_config.json")
        is_peft_model = os.path.exists(adapter_config_path)
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    tokenizer.pad_token = tokenizer.eos_token
    
    # Load model
    if is_peft_model:
        print("Loading as PEFT model")
        # Load base model with 4-bit quantization
        base_model = AutoModelForCausalLM.from_pretrained(
            args.base_model,
            torch_dtype=torch.float16,
            device_map="auto",
            load_in_4bit=True
        )
        # Load PEFT adapter
        model = PeftModel.from_pretrained(base_model, model_path)
    else:
        print("Loading as regular model")
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map="auto"
        )
    
    return model, tokenizer

def generate_single_question(generator, category, difficulty):
    """
    Generate a single quiz question.
    
    Args:
        generator: Text generation pipeline
        category (str): Category for the question
        difficulty (str): Difficulty level
        
    Returns:
        dict: Generated question
    """
    # Create prompt for single question
    prompt = f"""
Generate a quiz question about {category} with {difficulty} difficulty.

Question:"""
    
    # Generate text
    result = generator(
        prompt.strip(),
        return_full_text=False
    )[0]["generated_text"]
    
    # Parse the result to extract question and answer
    lines = result.strip().split('\n')
    
    question_text = ""
    answer_text = ""
    
    # Extract question and answer
    for i, line in enumerate(lines):
        if line.startswith("Question:"):
            question_text = line.replace("Question:", "").strip()
        elif line.startswith("Answer:"):
            answer_text = line.replace("Answer:", "").strip()
            break
        elif "Answer:" in line:
            parts = line.split("Answer:")
            if not question_text and len(parts) > 0:
                question_text = parts[0].strip()
            if len(parts) > 1:
                answer_text = parts[1].strip()
            break
    
    # If we couldn't parse properly, use the first line as question and second as answer
    if not question_text and len(lines) > 0:
        question_text = lines[0].strip()
    if not answer_text and len(lines) > 1:
        answer_text = lines[1].strip()
    
    return {
        "category": category,
        "difficulty": difficulty,
        "question": question_text,
        "answer": answer_text,
        "full_generation": result
    }

def generate_multiple_questions(generator, category, difficulty, num_questions):
    """
    Generate multiple quiz questions.
    
    Args:
        generator: Text generation pipeline
        category (str): Category for the questions
        difficulty (str): Difficulty level
        num_questions (int): Number of questions to generate
        
    Returns:
        list: List of generated questions
    """
    # Create prompt for multiple questions
    prompt = f"""
Generate a set of {num_questions} quiz questions about {category} with {difficulty} difficulty.

Question 1:"""
    
    # Generate text
    result = generator(
        prompt.strip(),
        return_full_text=False
    )[0]["generated_text"]
    
    # Parse the result to extract questions and answers
    questions = []
    current_question = None
    current_answer = None
    question_number = 1
    
    lines = result.strip().split('\n')
    for line in lines:
        line = line.strip()
        
        # Check for question markers
        if line.startswith(f"Question {question_number}:") or line.startswith(f"Q{question_number}:"):
            # Save previous question if exists
            if current_question:
                questions.append({
                    "category": category,
                    "difficulty": difficulty,
                    "question": current_question,
                    "answer": current_answer or "Not provided"
                })
            
            # Start new question
            current_question = line.split(":", 1)[1].strip()
            current_answer = None
            question_number += 1
        
        # Check for answer markers
        elif line.startswith("Answer:") or line.startswith("A:"):
            current_answer = line.split(":", 1)[1].strip()
    
    # Add the last question
    if current_question:
        questions.append({
            "category": category,
            "difficulty": difficulty,
            "question": current_question,
            "answer": current_answer or "Not provided"
        })
    
    # If parsing failed, generate questions one by one
    if not questions:
        print("Parsing multiple questions failed. Generating one by one...")
        for i in range(num_questions):
            question = generate_single_question(generator, category, difficulty)
            questions.append(question)
    
    return questions

def main():
    """Main function to generate quiz questions."""
    args = parse_args()
    
    # Load model and tokenizer
    model, tokenizer = load_model_and_tokenizer(args)
    
    # Create text generation pipeline
    generator = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_p=0.9,
        do_sample=True
    )
    
    # Generate questions
    print(f"Generating {args.num_questions} {args.difficulty} questions about {args.category}...")
    
    if args.num_questions <= 3:
        # Generate questions one by one for better quality
        questions = []
        for _ in range(args.num_questions):
            question = generate_single_question(generator, args.category, args.difficulty)
            questions.append(question)
    else:
        # Generate multiple questions at once
        questions = generate_multiple_questions(
            generator, args.category, args.difficulty, args.num_questions
        )
    
    # Save generated questions
    output_path = Path(args.output_file)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)
    
    print(f"Generated {len(questions)} questions and saved to {output_path}")
    
    # Print sample questions
    print("\nSample questions:")
    for i, q in enumerate(questions[:3], 1):
        print(f"\nQuestion {i}: {q['question']}")
        print(f"Answer: {q['answer']}")

if __name__ == "__main__":
    main()
