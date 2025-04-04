# DeepSeek LLM Training Paradigm Research

## DeepSeek-V3 Technical Report Findings

DeepSeek-V3 is a strong Mixture-of-Experts (MoE) language model with 671B total parameters with 37B activated for each token. Key aspects of their training paradigm include:

1. **Architecture**:
   - Multi-head Latent Attention (MLA) for efficient inference
   - DeepSeekMoE architecture for cost-effective training
   - Auxiliary-loss-free strategy for load balancing
   - Multi-token prediction training objective for stronger performance

2. **Training Process**:
   - Pre-training on 14.8T diverse and high-quality tokens
   - Supervised Fine-Tuning (SFT) stage
   - Reinforcement Learning (RL) stage
   - Total training cost: only 2.788M H800 GPU hours ($5.576M at $2/GPU hour)

3. **Distillation Techniques**:
   - Post-Training Knowledge Distillation from DeepSeek-R1
   - Innovative methodology to distill reasoning capabilities from Chain-of-Thought (CoT) models
   - Specifically distills from DeepSeek R1 series models into standard LLMs like DeepSeek-V3
   - Incorporates verification and reflection patterns from R1 into DeepSeek-V3
   - Maintains control over output style and length during distillation

## Model Distillation Process (from LinkedIn article)

1. **Teacher-Student Model Framework**:
   - Teacher: Larger, complex model (e.g., DeepSeek-V3)
   - Student: Smaller, more efficient model
   - Student model is trained to replicate outputs of teacher model

2. **Step-by-Step Distillation Process**:
   - Select Teacher and Student Models
   - Prepare dataset including original input data and teacher model's outputs
   - Train student model to minimize difference between its outputs and teacher model's outputs
   - Evaluate student model performance on held-out evaluation set
   - Fine-tune for specific applications

3. **Benefits of Model Distillation**:
   - Reduced cost: Smaller models require fewer computational resources
   - Faster response: Improved user experience and real-time applications
   - Accessibility: Can operate in low-resource environments like mobile devices

4. **Challenges**:
   - Dependence on teacher model's capabilities and biases
   - Complexity in tuning to achieve optimal results
   - Transparency and explainability concerns

## DeepSeek's Impact on AI Development (from Bruegel policy brief)

1. **Shift in AI Training Paradigm**:
   - By mid-2024, LLMs were running into diminishing returns to scale in training data and computational capacity
   - Training shifted from costly pre-training to cheaper fine-tuning
   - Chain-of-thought (CoT) training data includes questions and logical steps to reach correct answers
   - CoT data can be extracted from large 'teacher' LLMs to train small 'student' models

2. **Cost Structure Changes**:
   - Shift from high pre-training costs to lower fine-tuning costs for model developers
   - More inference costs for users
   - Smaller models are cheaper to use, increasing competition between models
   - Specialized models can still fetch premium prices

3. **Knowledge Extraction Between Models**:
   - Creates pressure on model developers to protect investments against free-riding
   - Presents dilemma for policymakers between promoting competition and protecting investment incentives
