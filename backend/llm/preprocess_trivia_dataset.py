#!/usr/bin/env python3
"""
Script to preprocess the Open Trivia Database dataset for fine-tuning Llama 3.2
using DeepSeek's distillation approach.

This script:
1. Loads the Open Trivia Database dataset
2. Formats it into prompt-completion pairs suitable for fine-tuning
3. Splits the data into training and validation sets
4. Saves the processed data in JSONL format

Usage:
    python preprocess_trivia_dataset.py [--input_path PATH] [--output_dir PATH]

Requirements:
    - pandas
    - numpy
    - tqdm
"""

import os
import json
import argparse
import pandas as pd
import numpy as np
from tqdm import tqdm
from pathlib import Path
from sklearn.model_selection import train_test_split

# Define prompt templates for quiz generation
SYSTEM_PROMPT = "You are an educational quiz generator that creates engaging and accurate quiz questions with answers."

# Template for single question generation
SINGLE_QUESTION_TEMPLATE = """
Generate a quiz question about {category} with {difficulty} difficulty.

Question: {question}
Correct Answer: {correct_answer}
Incorrect Options: {incorrect_options}
"""

# Template for multiple question generation
MULTIPLE_QUESTION_TEMPLATE = """
Generate a set of {num_questions} quiz questions about {category} with varying difficulty levels.

Question 1: {question_1}
Correct Answer: {correct_answer_1}
Incorrect Options: {incorrect_options_1}

Question 2: {question_2}
Correct Answer: {correct_answer_2}
Incorrect Options: {incorrect_options_2}

{additional_questions}
"""

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Preprocess trivia dataset for fine-tuning")
    parser.add_argument("--input_path", type=str, help="Path to the input CSV file")
    parser.add_argument("--output_dir", type=str, default="./processed_data", 
                        help="Directory to save processed data")
    return parser.parse_args()

def load_dataset(file_path):
    """
    Load the trivia dataset from a CSV file.
    
    Args:
        file_path (str): Path to the CSV file
        
    Returns:
        pd.DataFrame: Loaded dataset
    """
    print(f"Loading dataset from {file_path}")
    try:
        df = pd.read_csv(file_path)
        print(f"Loaded {len(df)} questions")
        return df
    except Exception as e:
        print(f"Error loading dataset: {e}")
        # If file_path is a directory, try to find CSV files
        if os.path.isdir(file_path):
            csv_files = list(Path(file_path).glob("**/*.csv"))
            if csv_files:
                print(f"Found CSV file: {csv_files[0]}")
                return pd.read_csv(csv_files[0])
        raise

def format_single_question(row):
    """
    Format a single question into a prompt-completion pair.
    
    Args:
        row (pd.Series): Row from the dataset
        
    Returns:
        dict: Formatted prompt-completion pair
    """
    # Extract data from row
    category = row.get('category', 'General Knowledge')
    difficulty = row.get('difficulty', 'medium')
    question = row.get('question', '')
    correct_answer = row.get('correct_answer', '')
    
    # Handle incorrect options
    if 'incorrect_answers' in row:
        if isinstance(row['incorrect_answers'], str):
            try:
                incorrect_options = json.loads(row['incorrect_answers'])
                if isinstance(incorrect_options, list):
                    incorrect_options = ', '.join(incorrect_options)
                else:
                    incorrect_options = str(incorrect_options)
            except:
                incorrect_options = row['incorrect_answers']
        else:
            incorrect_options = str(row['incorrect_answers'])
    else:
        incorrect_options = "Not available"
    
    # Format prompt
    prompt = SINGLE_QUESTION_TEMPLATE.format(
        category=category,
        difficulty=difficulty,
        question=question,
        correct_answer=correct_answer,
        incorrect_options=incorrect_options
    )
    
    # Format completion (what we want the model to generate)
    completion = f"Question: {question}\nAnswer: {correct_answer}"
    
    return {
        "prompt": prompt.strip(),
        "completion": completion.strip()
    }

def format_multiple_questions(questions_group, num_questions=3):
    """
    Format multiple questions into a prompt-completion pair.
    
    Args:
        questions_group (pd.DataFrame): Group of questions
        num_questions (int): Number of questions to include
        
    Returns:
        dict: Formatted prompt-completion pair
    """
    # Sample questions if there are more than num_questions
    if len(questions_group) > num_questions:
        questions_sample = questions_group.sample(num_questions)
    else:
        questions_sample = questions_group
    
    # Get category (use the most common one)
    category = questions_sample['category'].mode()[0]
    
    # Format individual questions
    formatted_questions = []
    completions = []
    
    for i, (_, row) in enumerate(questions_sample.iterrows(), 1):
        question = row.get('question', '')
        correct_answer = row.get('correct_answer', '')
        
        # Handle incorrect options
        if 'incorrect_answers' in row:
            if isinstance(row['incorrect_answers'], str):
                try:
                    incorrect_options = json.loads(row['incorrect_answers'])
                    if isinstance(incorrect_options, list):
                        incorrect_options = ', '.join(incorrect_options)
                    else:
                        incorrect_options = str(incorrect_options)
                except:
                    incorrect_options = row['incorrect_answers']
            else:
                incorrect_options = str(row['incorrect_answers'])
        else:
            incorrect_options = "Not available"
        
        # Add to formatted questions
        formatted_questions.append({
            f"question_{i}": question,
            f"correct_answer_{i}": correct_answer,
            f"incorrect_options_{i}": incorrect_options
        })
        
        # Add to completions
        completions.append(f"Question {i}: {question}\nAnswer: {correct_answer}")
    
    # Combine all questions into a single prompt
    prompt_dict = {
        "category": category,
        "num_questions": len(formatted_questions),
        "additional_questions": ""
    }
    
    # Add each question's fields to the prompt dictionary
    for q_dict in formatted_questions:
        prompt_dict.update(q_dict)
    
    # Format the additional questions (if more than 2)
    if len(formatted_questions) > 2:
        additional_questions = []
        for i in range(3, len(formatted_questions) + 1):
            q = formatted_questions[i-1]
            additional_questions.append(
                f"Question {i}: {q[f'question_{i}']}\n"
                f"Correct Answer: {q[f'correct_answer_{i}']}\n"
                f"Incorrect Options: {q[f'incorrect_options_{i}']}"
            )
        prompt_dict["additional_questions"] = "\n\n".join(additional_questions)
    
    # Format the final prompt
    prompt = MULTIPLE_QUESTION_TEMPLATE.format(**prompt_dict)
    
    # Format the final completion
    completion = "\n\n".join(completions)
    
    return {
        "prompt": prompt.strip(),
        "completion": completion.strip()
    }

def create_dataset_variations(df):
    """
    Create different variations of the dataset for fine-tuning.
    
    Args:
        df (pd.DataFrame): Original dataset
        
    Returns:
        list: List of formatted examples
    """
    print("Creating dataset variations...")
    formatted_examples = []
    
    # 1. Single question format
    print("Formatting single questions...")
    for _, row in tqdm(df.iterrows(), total=len(df)):
        formatted_examples.append(format_single_question(row))
    
    # 2. Multiple question format (grouped by category)
    print("Formatting multiple questions by category...")
    for category, group in tqdm(df.groupby('category')):
        # Create multiple sets of questions for each category
        num_sets = max(1, len(group) // 3)  # At least 1 set, or 1 set per 3 questions
        for _ in range(min(num_sets, 10)):  # Cap at 10 sets per category to avoid imbalance
            formatted_examples.append(format_multiple_questions(group))
    
    print(f"Created {len(formatted_examples)} formatted examples")
    return formatted_examples

def save_jsonl(data, output_path):
    """
    Save data in JSONL format.
    
    Args:
        data (list): List of dictionaries to save
        output_path (str): Path to save the JSONL file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item) + '\n')
    print(f"Saved {len(data)} examples to {output_path}")

def main():
    """Main function to preprocess the trivia dataset."""
    args = parse_args()
    
    # Create output directory if it doesn't exist
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load dataset
    if args.input_path:
        df = load_dataset(args.input_path)
    else:
        # Try to find the dataset in the default location
        try:
            import kagglehub
            dataset_path = kagglehub.dataset_download(
                "shreyasur965/open-trivia-database-quiz-questions-all-categories"
            )
            df = load_dataset(dataset_path)
        except Exception as e:
            print(f"Error: {e}")
            print("Please provide the input path to the dataset using --input_path")
            return
    
    # Create dataset variations
    formatted_examples = create_dataset_variations(df)
    
    # Split into training and validation sets (90% train, 10% validation)
    train_examples, val_examples = train_test_split(
        formatted_examples, test_size=0.1, random_state=42
    )
    
    # Save the processed data
    save_jsonl(train_examples, output_dir / "train.jsonl")
    save_jsonl(val_examples, output_dir / "validation.jsonl")
    
    # Save a small sample for testing
    sample_size = min(10, len(train_examples))
    sample_examples = train_examples[:sample_size]
    save_jsonl(sample_examples, output_dir / "sample.jsonl")
    
    print(f"\nPreprocessing complete! Files saved to {output_dir}")
    print(f"Training examples: {len(train_examples)}")
    print(f"Validation examples: {len(val_examples)}")
    print(f"Sample examples: {len(sample_examples)}")

if __name__ == "__main__":
    main()
