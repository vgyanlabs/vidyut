# Free Datasets for Quiz Generation

## Open Trivia Database
- **Source**: [Kaggle - Open Trivia Database Quiz Questions All Categories](https://www.kaggle.com/datasets/shreyasur965/open-trivia-database-quiz-questions-all-categories)
- **Description**: Comprehensive collection of trivia questions from the Open Trivia Database
- **Features**:
  - Multiple attributes for each question (question text, correct answer, category, difficulty level)
  - Diverse topics (General Knowledge, Science, Entertainment, etc.)
  - Difficulty levels ranging from easy to hard
  - Licensed under CC BY-SA 4.0
- **Download Method**: Available via Kaggle API
  ```python
  import kagglehub
  path = kagglehub.dataset_download("shreyasur965/open-trivia-database-quiz-questions-all-categories")
  ```

## TriviaQA
- **Source**: [TriviaQA Dataset](https://paperswithcode.com/dataset/triviaqa)
- **Description**: Realistic text-based question answering dataset
- **Features**:
  - 950K question-answer pairs from 662K documents
  - Collected from Wikipedia and the web
  - More challenging than standard QA benchmarks like SQuAD
  - Includes both human-verified and machine-generated QA subsets
  - Requires reasoning across multiple sentences
- **Paper**: [TriviaQA: A Large Scale Distantly Supervised Challenge Dataset for Reading Comprehension](https://arxiv.org/pdf/1705.03551v2.pdf)

## Question Answering Datasets Collection
- **Source**: [GitHub - RenzeLou/Datasets-for-Question-Answering](https://github.com/RenzeLou/Datasets-for-Question-Answering)
- **Description**: Comprehensive collection of datasets used in QA tasks
- **Notable Datasets**:
  - **MCTest**: Freely available set of stories and associated multiple-choice reading comprehension questions
  - **SQuAD**: 100,000+ questions posed by crowdworkers on Wikipedia articles
  - **RACE**: 97,867 questions from English exams with 4 candidate answers each
  - **AI2 Reasoning Challenge (ARC)**: Multiple-choice questions from science exams (grade 3-9)
  - **Natural Questions**: 307,373 training examples with Google queries and corresponding Wikipedia pages

## Other Relevant Datasets
- **Question-Answer Dataset** on Kaggle: Contains Wikipedia article text with questions and answers
- **Large QA Datasets Collection** on GitHub: Comprehensive collection for natural language processing tasks

## Recommended Dataset for Quiz Generation
For the purpose of fine-tuning Llama 3.2 for quiz generation, the **Open Trivia Database** is most suitable because:
1. It's specifically designed for quiz/trivia applications
2. It has structured question-answer pairs with categories and difficulty levels
3. It's freely available with a permissive license
4. It's relatively small and manageable for fine-tuning on Google Colab's free tier
5. The format is straightforward for preprocessing and training

## Data Collection Strategy
1. Download the Open Trivia Database dataset using the Kaggle API
2. Supplement with selected examples from TriviaQA for more complex questions
3. Format the combined dataset for fine-tuning Llama 3.2 using DeepSeek's distillation approach
4. Create preprocessing scripts to convert the data into the required format for training
