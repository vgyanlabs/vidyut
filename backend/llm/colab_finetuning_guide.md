# Fine-tuning Llama 3.2 for Quiz Generation on Google Colab Free Tier

This guide provides step-by-step instructions for fine-tuning Llama 3.2 on quiz generation data using DeepSeek's distillation approach on Google Colab's free tier. The guide follows best practices from DeepSeek's training paradigm while adapting them to work within the constraints of Colab's free resources.

## Prerequisites

- Google account with access to Google Colab
- Basic understanding of Python and machine learning concepts
- Kaggle account for dataset access

## Step 1: Set Up Google Colab Environment

1. Go to [Google Colab](https://colab.research.google.com/)
2. Create a new notebook
3. Set up GPU acceleration:
   - Click on "Runtime" > "Change runtime type"
   - Select "T4 GPU" from the Hardware accelerator dropdown
   - Click "Save"

## Step 2: Install Required Dependencies

Run the following code in a Colab cell to install the necessary packages:

```python
# Install required packages
!pip install -q transformers==4.37.2 peft==0.7.1 accelerate==0.25.0 bitsandbytes==0.41.1 trl==0.7.4 kagglehub datasets

# Verify GPU availability
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")
```

## Step 3: Set Up Kaggle API for Dataset Access

To download the Open Trivia Database dataset, you'll need to set up Kaggle API credentials:

```python
# Upload kaggle.json
from google.colab import files
uploaded = files.upload()  # Upload your kaggle.json file

# Set up Kaggle credentials
!mkdir -p ~/.kaggle
!cp kaggle.json ~/.kaggle/
!chmod 600 ~/.kaggle/kaggle.json

# Verify Kaggle setup
!kaggle --version
```

> **Note**: To get your Kaggle API credentials:
> 1. Go to your Kaggle account settings
> 2. Scroll down to the "API" section
> 3. Click "Create New API Token" to download kaggle.json

## Step 4: Clone Repository and Download Dataset

```python
# Clone the repository with scripts
!git clone https://github.com/yourusername/llm-quiz-generation.git
%cd llm-quiz-generation

# Download the Open Trivia Database dataset
!python scripts/download_trivia_dataset.py

# Alternative direct download if script fails
!kagglehub dataset download shreyasur965/open-trivia-database-quiz-questions-all-categories
```

## Step 5: Preprocess the Dataset

```python
# Preprocess the dataset for fine-tuning
!python scripts/preprocess_trivia_dataset.py --output_dir ./processed_data

# Check the processed data
!ls -la ./processed_data
!head -n 3 ./processed_data/train.jsonl
```

## Step 6: Implement DeepSeek's Distillation Approach

DeepSeek's distillation approach involves using a larger model as a teacher to guide the training of a smaller model. Since we're working with Colab's free tier, we'll adapt this approach by:

1. Using prompt engineering to create high-quality training examples
2. Implementing Parameter-Efficient Fine-Tuning (PEFT) with LoRA
3. Using 4-bit quantization to reduce memory requirements

```python
# Create a custom training script based on DeepSeek's approach
%%writefile custom_distillation.py
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset

# Load tokenizer and model
model_name = "meta-llama/Llama-3.2-1B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Load model with 4-bit quantization
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    load_in_4bit=True,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Prepare model for PEFT
model = prepare_model_for_kbit_training(model)

# Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
)

# Apply LoRA to model
model = get_peft_model(model, lora_config)

# Load dataset
dataset = load_dataset("json", data_files={"train": "processed_data/train.jsonl", "validation": "processed_data/validation.jsonl"})

# Define training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    save_steps=200,
    logging_steps=100,
    learning_rate=2e-4,
    weight_decay=0.01,
    fp16=True,
    warmup_steps=100,
    evaluation_strategy="steps",
    eval_steps=200,
    save_total_limit=3,
    load_best_model_at_end=True,
)

# Define Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
)

# Train model
trainer.train()

# Save model
model.save_pretrained("./finetuned_model")
```

## Step 7: Execute Fine-tuning

```python
# Run the custom distillation script
!python custom_distillation.py

# Monitor GPU memory usage during training
!nvidia-smi
```

## Step 8: Handle Colab Disconnections

Google Colab may disconnect during long training sessions. To handle this:

```python
# Save checkpoint after each epoch
from google.colab import drive
drive.mount('/content/drive')

# Copy checkpoints to Google Drive
!cp -r ./results /content/drive/MyDrive/llm_training/
```

To resume training after a disconnection:

```python
# Load from checkpoint
!python scripts/finetune_llama_quiz.py --model_size 1B --data_path ./processed_data --output_dir ./finetuned_model --resume_from_checkpoint /content/drive/MyDrive/llm_training/results/checkpoint-XXX
```

## Step 9: Evaluate the Fine-tuned Model

```python
# Generate quiz questions with the fine-tuned model
!python scripts/generate_quiz.py --model_path ./finetuned_model --num_questions 5 --category "Science" --output_file generated_quiz.json

# View generated questions
!cat generated_quiz.json
```

## Step 10: Save and Export the Model

```python
# Compress the model for download
!tar -czvf finetuned_model.tar.gz ./finetuned_model

# Download the compressed model
from google.colab import files
files.download('finetuned_model.tar.gz')

# Save to Google Drive
!cp finetuned_model.tar.gz /content/drive/MyDrive/llm_training/
```

## Advanced Techniques from DeepSeek's Paradigm

### Knowledge Distillation

DeepSeek's approach uses knowledge distillation to transfer knowledge from larger models to smaller ones. While we can't run multiple large models on Colab's free tier, we can still apply some principles:

```python
# Example of using pre-computed logits for distillation
# This would typically come from a larger model
import torch
import torch.nn.functional as F

def distillation_loss(student_logits, teacher_logits, temperature=2.0):
    """
    Compute the knowledge distillation loss.
    
    Args:
        student_logits: Logits from the student model
        teacher_logits: Pre-computed logits from the teacher model
        temperature: Temperature for softening the distributions
        
    Returns:
        Distillation loss
    """
    soft_targets = F.softmax(teacher_logits / temperature, dim=-1)
    soft_prob = F.log_softmax(student_logits / temperature, dim=-1)
    distillation_loss = -(soft_targets * soft_prob).sum(dim=-1).mean()
    return distillation_loss * (temperature ** 2)
```

### Optimizing for Colab's Free Tier

To maximize the use of Colab's free resources:

1. **Gradient Checkpointing**: Reduces memory usage at the cost of increased computation time
   ```python
   model.gradient_checkpointing_enable()
   ```

2. **Mixed Precision Training**: Uses lower precision for certain operations
   ```python
   training_args = TrainingArguments(
       # ...
       fp16=True,
       # ...
   )
   ```

3. **Smaller Batch Size with Gradient Accumulation**: Simulates larger batch sizes
   ```python
   training_args = TrainingArguments(
       # ...
       per_device_train_batch_size=2,
       gradient_accumulation_steps=8,  # Effective batch size of 16
       # ...
   )
   ```

## Troubleshooting

### Out of Memory Errors

If you encounter OOM (Out of Memory) errors:

1. Reduce batch size and increase gradient accumulation steps
2. Use a smaller model (1B instead of 3B)
3. Reduce the maximum sequence length
4. Use more aggressive quantization

### Slow Training

If training is too slow:

1. Reduce the dataset size for initial experiments
2. Use fewer training epochs
3. Reduce the number of validation steps

### Colab Disconnections

If Colab disconnects frequently:

1. Use Google Drive to save checkpoints more frequently
2. Split training into smaller sessions
3. Consider using Colab Pro for longer runtimes

## Conclusion

By following this guide, you've successfully fine-tuned Llama 3.2 for quiz generation using DeepSeek's distillation approach on Google Colab's free tier. The resulting model can generate high-quality quiz questions across various categories and difficulty levels.

For production use, consider:
1. Training on more data
2. Using a larger model if resources permit
3. Implementing more sophisticated distillation techniques
4. Deploying the model on a dedicated server for inference
