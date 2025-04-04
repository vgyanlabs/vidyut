#!/usr/bin/env python3
"""
Script to download the Open Trivia Database dataset from Kaggle.
This script requires the Kaggle API credentials to be set up.

Usage:
    python download_trivia_dataset.py

Requirements:
    - kagglehub
    - pandas
"""

import os
import sys
import kagglehub
import pandas as pd
from pathlib import Path

def download_open_trivia_dataset():
    """
    Downloads the Open Trivia Database dataset from Kaggle using kagglehub.
    
    Returns:
        str: Path to the downloaded dataset
    """
    print("Downloading Open Trivia Database dataset...")
    try:
        # Download the dataset
        path = kagglehub.dataset_download(
            "shreyasur965/open-trivia-database-quiz-questions-all-categories"
        )
        print(f"Dataset downloaded successfully to: {path}")
        return path
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        print("\nTo set up Kaggle API credentials:")
        print("1. Create a Kaggle account if you don't have one")
        print("2. Go to Account > Create API Token to download kaggle.json")
        print("3. Place kaggle.json in ~/.kaggle/ directory")
        print("4. Run: chmod 600 ~/.kaggle/kaggle.json")
        sys.exit(1)

def explore_dataset(dataset_path):
    """
    Explores the downloaded dataset and prints basic information.
    
    Args:
        dataset_path (str): Path to the downloaded dataset
    """
    print("\nExploring dataset files:")
    
    # List all files in the dataset directory
    dataset_dir = Path(dataset_path)
    for file_path in dataset_dir.glob('**/*'):
        if file_path.is_file():
            print(f"Found file: {file_path.name} ({file_path.stat().st_size / 1024:.2f} KB)")
            
            # If it's a CSV file, show a preview
            if file_path.suffix.lower() == '.csv':
                try:
                    df = pd.read_csv(file_path)
                    print(f"  - Shape: {df.shape}")
                    print(f"  - Columns: {', '.join(df.columns)}")
                    print("  - Preview:")
                    print(df.head(3).to_string(index=False))
                    print(f"  - Total questions: {len(df)}")
                except Exception as e:
                    print(f"  - Error reading CSV: {e}")

if __name__ == "__main__":
    # Download the dataset
    dataset_path = download_open_trivia_dataset()
    
    # Explore the dataset
    explore_dataset(dataset_path)
    
    print("\nDataset download and exploration complete!")
