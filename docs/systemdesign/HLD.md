![EvaluationService](https://github.com/user-attachments/assets/1e7dda77-3585-43c9-addf-e87b444822f3)


# Technical PRD: Adaptive Quiz Generation Module

## Overview  
The Adaptive Quiz Generation Module is a low-cost web application that dynamically creates and delivers quizzes (multiple-choice questions, diagram-based questions, coding challenges, etc.) derived from the content of PDF textbooks. It leverages Large Language Models (LLMs) to understand textbook content and generate questions, including code-oriented LLMs for programming exercises. The system adapts to a learner’s progress in real-time, adjusting question difficulty and topics to focus on weak areas. Cost efficiency is a priority – the module uses an optimized inference engine (vLLM) to serve models at high throughput and low infrastructure cost ([vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention | vLLM Blog](https://blog.vllm.ai/2023/06/20/vllm.html#:~:text=keys%20and%20values,requiring%20any%20model%20architecture%20changes)). The following PRD details user stories, features, requirements, architecture, implementation plan, and key algorithms for the module, as well as potential failure points and mitigation strategies.

## User Stories  
- **Learner:** *“As a learner, I want to take quizzes that adapt to my knowledge level, so I’m continuously challenged but not overwhelmed.”*  
- **Learner:** *“As a learner, I want questions in multiple formats (text, images, code) including interactive diagrams and coding tasks, so I can practice different skills.”*  
- **Learner:** *“I want immediate feedback on my answers and to see my progress, so I can learn from mistakes and track improvement.”*  
- **Content Manager/Instructor:** *“As an instructor, I want to upload a PDF textbook or course material, and have the system automatically generate a comprehensive quiz bank from it.”*  
- **System Administrator:** *“As an admin, I want the system to run on minimal hardware (e.g. a single GPU server) and use efficient models, to keep operating costs low while serving multiple users.”*

## Features and Functional Requirements  

- **Automated Question Generation:** The system can ingest PDF textbooks and automatically generate a variety of question types from the material. This includes: 
  - **Multiple-Choice Questions (MCQs):** with one correct answer and plausible distractors derived from the text.  
  - **Diagram-Based Questions:** using figures or diagrams from the book (or generated) where learners may answer questions about an image (e.g. identifying parts of a diagram or interpreting a graph).  
  - **Fill-in-the-Blank and Short Answer:** key term fill-ins or short response questions based on important concepts in the text.  
  - **Coding Challenges:** if the content is programming-related, the system generates coding exercise prompts (and reference solutions/tests) using an LLM code generator.  
- **Adaptive Delivery:** Quiz content difficulty and focus adapt in real-time to the learner’s performance. For example, correct answers lead to slightly harder or new-topic questions, while incorrect answers trigger easier questions or a review of prerequisite concepts. The goal is to keep the learner in an optimal challenge zone and reinforce weaker areas.  
- **Progress Tracking and Feedback:** The module tracks each learner’s progress (scores, attempted questions, mastery per topic). It provides immediate feedback on each answer (e.g. correct/incorrect with an explanation drawn from the textbook content or solution) and periodic summaries of progress. Learners can see metrics like current level, topics mastered, or areas needing improvement.  
- **Dynamic Quiz Assembly:** Rather than a static question set, each quiz session is dynamically generated. The system uses the content knowledge base (extracted from PDFs) and the learner’s current state to pick or generate the next question on the fly. This ensures two learners might get different questions based on their strengths/weaknesses, and repeated sessions continue to present new challenges.  
- **Rich Media and Interaction:** The web UI supports embedding images (diagrams, charts) in questions and possibly interactive elements (e.g. a draggable label onto a diagram, or an embedded code editor for coding questions). This enriches the assessment beyond text-only Q&A.  
- **LLM-Powered Explanations (Optional):** Beyond just grading answers, the system can use the LLM to generate explanations or hints. For example, after an incorrect answer, it might provide a hint or a brief explanation drawn from the textbook content to help the learner understand the correct answer.  

**Non-Functional Requirements:**  
- **Cost Efficiency:** The solution must be inexpensive to run. This entails using open-source models and efficient serving. The use of vLLM is mandated to maximize throughput per hardware (achieving up to 24× higher inference throughput than naive approaches) ([vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention | vLLM Blog](https://blog.vllm.ai/2023/06/20/vllm.html#:~:text=keys%20and%20values,requiring%20any%20model%20architecture%20changes)). The system should ideally run on a single modest server (e.g. one GPU machine) serving multiple concurrent learners without significant lag.  
- **Performance:** Latency for question generation should be reasonable – ideally a few seconds per new question at most – to keep the user engaged. Using continuous batching in vLLM, multiple generation requests will be handled in parallel to reduce wait times.  
- **Scalability:** Support a growing number of users with minimal cost increase. The design should allow caching and reuse of generated questions when appropriate to avoid repeated computation. If many users study the same textbook, the system can reuse or slightly tweak questions from a shared question pool to save compute.  
- **Accuracy and Relevance:** Generated questions must be factually correct and relevant to the source material. The system should minimize hallucinations or content outside the PDF’s scope. Each question’s answer must be verifiably found in the source text or logically derived from it. (This may involve retrieving the related section from the textbook when prompting the LLM to ensure fidelity.)  
- **Security and Privacy:** All user progress data is stored securely. The code execution sandbox for coding challenges must be secure, preventing malicious code from affecting the host. No sensitive user data is shared externally.  
- **Maintainability:** The system should be modular, making it easy to swap out the LLM model or upgrade components. It should also allow adding new question formats in the future. Clear logging and monitoring are needed for maintenance and to audit the quality of generated content.  
- **Usability:** The web UI should be intuitive, responsive, and accessible. Learners should easily navigate between questions, view their progress, and input answers (including writing and running code for code challenges). 

## System Architecture Overview  
![EvaluationModule](https://github.com/user-attachments/assets/d65e8aed-f452-4723-ac21-53593c54476d)

*Figure: System architecture and component interaction.* The architecture consists of a web-based front end and a back end with integrated LLM services and an adaptive quiz engine. Key components include:  

- **Web Frontend (UI):** A single-page web application (e.g. built with React or similar) that presents questions, answer input fields, diagrams, and a progress dashboard. It communicates with the backend via HTTPS (REST or WebSocket API). The UI updates adaptively without full page reloads. It also includes elements like a progress bar and possibly a timer or other interactive widgets.  
- **Backend Application Server:** The backend is the core orchestrator (could be implemented in Python with FastAPI/Flask or Node.js, etc.). It exposes API endpoints for the frontend: e.g. “GET next_question”, “POST answer”. The backend handles session management, routing requests to appropriate internal modules, and aggregating results.  
- **Knowledge Extraction & Storage:** When a new PDF textbook is added (by an instructor or admin), a **Knowledge Extraction Process** parses the PDF. This may use PDF parsing libraries to extract text (and images) from chapters and sections. The text is then segmented (by chapter/section or a fixed token length) and indexed in an **Extracted Knowledge Base**. The knowledge base could be a simple document store or a vector database for semantic search. It stores the content (text chunks, associated images/diagrams metadata, etc.), enabling retrieval of relevant context for question generation.  
- **LLM Inference Service (vLLM):** This module hosts the language model(s) using vLLM for efficient inference. It can be a separate service or part of the backend. The service loads one or more models:
  - A **QA/Content Generation LLM** (e.g. an open-source instruction-tuned model like LLaMA-2 or GPT-J) that is used to generate explanations, quiz questions, and answers based on the textbook content.
  - A **Code Generation LLM** (e.g. Code Llama or StarCoder) specialized for programming tasks, used to generate coding challenge questions and reference solutions or test cases.  
  The vLLM server manages GPU memory and batches requests to achieve high throughput, making the LLM usage cost-effective ([vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention | vLLM Blog](https://blog.vllm.ai/2023/06/20/vllm.html#:~:text=keys%20and%20values,requiring%20any%20model%20architecture%20changes)). The backend communicates with this service by sending prompts and receiving generated outputs.  
- **Adaptive Quiz Engine:** This is the heart of the learning logic. It maintains a **User Model** for each learner (a record of performance metrics, e.g. scores, mastery levels per topic). The engine decides what question to give next. It takes into account the user’s past answers, the coverage of content so far, and target difficulty. It interacts with the LLM service to generate questions on-demand:
  - For a conceptual question, it will retrieve the relevant section from the Knowledge Base (e.g. the chapter or paragraph about the concept the engine wants to assess) and prompt the QA LLM to generate a question (and solution) from that context.
  - For a coding question, it will identify a programming concept from the content (or if the textbook itself contains code examples, use those) and prompt the Code LLM to propose a coding exercise and a solution or test cases.  
  The Adaptive Engine also evaluates the user’s answer (see below) and updates the User Model. It formulates the feedback sent back to the frontend (marking correct/incorrect, providing solution explanation if needed).  
- **Answer Evaluation Module:** Part of the engine or a sub-component that checks answers:
  - **Objective answers (MCQ/true-false):** simply compare the user’s choice to the correct answer key generated by the LLM.
  - **Fill-in or Short text answers:** use string matching or semantic similarity to the expected answer; possibly leverage an LLM to score the answer or extract keywords.
  - **Coding answers:** run the user’s code in a **Code Execution Sandbox** (an isolated environment, e.g. using Docker or a service like Judge0) with predefined test cases generated by the Code LLM. The sandbox returns pass/fail results for the tests to determine correctness.  
  The evaluation module ensures uniform grading. It must do so safely (especially for code) and within a short time (e.g., impose a time limit on code execution).  
- **User Progress Database:** A database (SQL or NoSQL) stores users’ quiz history, scores, and current state (for example, how many questions answered in each topic, current difficulty level, etc.). It also can store the questions that were presented and the user’s answers, which is useful for reviewing past performance and for auditing the quality of generated questions.  
- **Logging & Monitoring:** Although not a user-facing component, the system includes extensive logging of the LLM interactions and question quality checks (for instance, logging the source content snippet used for each generated question, LLM prompt and output, and user success rate). This helps developers monitor for issues like nonsensical questions or model errors.  

**Component Interaction Flow:** The typical flow in a quiz session is: the learner’s browser requests a new question; the backend’s Adaptive Engine picks a target topic/difficulty and uses the LLM (and content from the knowledge base) to generate that question; the backend returns the question to the frontend for display. When the learner submits an answer, the backend evaluates it (possibly calling the sandbox for code or LLM for open text), updates the user’s mastery scores, and returns feedback plus the trigger for the next question. This cycle repeats, guided by the Adaptive Engine’s logic. The architecture diagram above illustrates these interactions, from PDF ingestion to adaptive quiz delivery.

## Implementation Plan  

The development will be organized into modular components, allowing incremental build and testing of each part:

1. **PDF Ingestion & Knowledge Extraction Module:**  
   - **Goal:** Enable admins to upload PDF textbooks and transform them into a structured knowledge repository.  
   - **Implementation:** Use a PDF parsing library (such as PyMuPDF or PDF.js) to extract text and images. Develop a parser that splits the text by logical sections (chapters, headings) and cleans it (remove headers/footers, OCR if needed for scanned PDFs).  
   - **Knowledge Structuring:** For each section, optionally use an LLM to summarize key points or extract key terms. Store the section text (and summary or keywords) in a document store. If using a vector database (like FAISS or Milvus), also compute embeddings for each section for semantic search.  
   - **Output:** An **Extracted Knowledge Base** ready to support question generation (text chunks indexed by topic). This module can be developed and tested independently by checking that it correctly captures the content of the PDF (e.g., by querying it for known facts in the text).  

2. **Question Generation Module (QA):**  
   - **Goal:** Generate high-quality quiz questions (and answers) from a given textbook section or concept.  
   - **Implementation:** Prompt engineering for the chosen LLM: design prompts that instruct the model to produce a question, the correct answer, and plausible distractors (for MCQ) based on provided source text. Example prompt: *“You are an educational quiz generator. Using the following text, create a challenging multiple-choice question with 4 options (A-D) and identify the correct answer. Text: [excerpt]”*. Ensure the prompt and instructions yield the desired format (perhaps structured as JSON for easy parsing of result).  
   - Develop formatting logic to parse the LLM response into the system’s internal question format (e.g. an object with fields: question_text, options[], correct_answer, explanation).  
   - **Diagram-based Questions:** If an extracted section references a figure (e.g. “Figure 3 shows …”), consider generating a question that asks about that figure. In this case, if the figure image is available, the question can include the image (frontend will display it). For MVP, diagram questions might be manually flagged or simply included as image + normal question text. (Automated image-based question generation can be extended later by using image captioning or vision models to interpret diagrams.)  
   - **Testing:** This module can be tested by feeding it sample text and reviewing the outputs. Adjust prompts to avoid questions that are too trivial or too difficult. Possibly implement validation rules (e.g. ensure distractors are not repeating the correct answer, etc.).  

3. **Coding Challenge Generation Module:**  
   - **Goal:** Create programming exercise questions from content and provide a way to automatically evaluate them.  
   - **Implementation:** Identify sections in the PDF that relate to programming (e.g. code examples, algorithms). For each such section or concept, prompt a code-oriented LLM with something like: *“Given the concept X from the text, suggest a programming exercise for the learner to implement X, and provide a correct solution and 3 test cases.”* The output would contain a problem description (question), a reference solution, and a set of test inputs/outputs for evaluation.  
   - Integrate these test cases into the **Code Execution Sandbox** setup so that when a learner submits code, the backend can run the tests and automatically grade the solution.  
   - **Sandbox Setup:** Use a containerized environment or a secure sandbox API that supports the programming language in question (e.g. Python if the course is Python-based). This component will require careful security (disallow network access, limit runtime and memory).  
   - **Testing:** Verify that generated coding challenges are solvable and that the reference solution passes the test cases. One might have a developer manually attempt the generated questions to ensure quality.  

4. **Adaptive Quiz Engine & User Model:**  
   - **Goal:** Implement the logic that selects questions adaptively and updates learner progress.  
   - **Implementation:** Design a **User Model** data structure, for example: a mapping of content topics or skill areas to a mastery score (which could be a numeric value updated with each question), as well as the current difficulty level the user is operating at. Also include recent question history to avoid repetition.  
   - Develop the **adaptation algorithm** (see pseudocode in next section) that uses the User Model to choose the next question’s topic and difficulty. For instance, maintain a list of pending topics or learning objectives from the textbook; pick one the user has low mastery in. Difficulty can be represented by how deep or tricky the question is (could correlate with how detailed the context excerpt is or whether the question is direct recall vs. applied concept).  
   - Integrate with Question Generation: once the engine decides on topic/difficulty, it fetches relevant content from the knowledge base and calls the Question Generation module (or Coding module) to get a concrete question. It then delivers that to the user.  
   - After receiving the user’s answer, the engine calls the Answer Evaluation logic. Based on correct/incorrect, it updates the User Model (e.g. increase mastery score for that topic if correct, or decrease if wrong). It could also adjust difficulty level (e.g. if the user has answered the last 3 questions correctly quickly, it might level up the difficulty of subsequent questions).  
   - **Feedback:** Prepare a brief feedback message. For a correct answer, it might confirm and add a bit more explanation (*“Correct! The CPU indeed performs arithmetic/logical operations as it’s the brain of the computer.”*). For an incorrect answer, it might show the correct answer and a hint (*“The correct answer is A. Recall that the CPU’s primary role is executing instructions, not storing data.”*). These can be generated by templating from the known solution or even asking the LLM to provide an explanation.  
   - **Testing:** Simulate a quiz session with a test user profile. One way is to create automated tests that feed predetermined answers (some right, some wrong) and ensure the engine adapts (e.g. if wrong, next question should be easier or on same topic). Check that the user model updates as expected (e.g. mastery scores trend upwards on correct answers).  

5. **Frontend UI Integration:**  
   - **Goal:** Develop the web interface to present questions and receive answers, and integrate it with the backend API.  
   - **Implementation:** Build UI components for each question type: 
       - MCQ: display question text and multiple choice options with radio buttons. 
       - Diagram question: display an image (from a URL or base64 from the backend) with accompanying question text. Potentially allow zoom or full-screen view for clarity. 
       - Coding question: provide a code editor (could integrate a web-based editor component) where the learner writes code. Include a “Run Tests” or “Submit” button that triggers the evaluation. Show the output or which tests passed/failed.  
     Also create a progress indicator (e.g. a progress bar or a numerical score) and possibly a sidebar or modal that shows overall performance so far.  
   - Use a modern web framework to handle state – for example, when the user submits an answer, disable input until the result comes back, then show feedback (highlight the correct answer if they were wrong, etc.). Ensure the UI is responsive and works on different screen sizes (some learners might use tablets or phones).  
   - **Testing:** Perform user testing on the UI for clarity. Ensure that images load correctly, code editor works in various browsers, and the overall experience is smooth (no flickers or long unresponsive states).  

6. **Iteration and Refinement:**  
   - Once all pieces are integrated, conduct an end-to-end test with a sample textbook. Evaluate the quality of the generated questions and the adaptivity. Likely, prompt tuning or algorithm adjustments will be needed based on these tests. For example, if questions are too hard/easy, adjust the difficulty selection logic or the prompt that guides difficulty.  
   - Add caching of questions: if the system sees the same combination of topic and difficulty frequently, it could reuse a question generated earlier instead of calling the LLM each time. This cache can be built up in a database of questions with tags (topic, difficulty) and used to further reduce latency and cost.  
   - Monitor resource usage under load (simulate multiple users) and tune the vLLM server parameters (like batch size) to ensure cost targets are met.  
   - Prepare deployment: containerize the application for a cloud VM or a minimal Kubernetes cluster. Ensure that the model files are optimized (maybe quantized if needed for speed) and that the startup of the system is automated.  

By following this plan, we develop each module with clear responsibilities, then integrate them into a full system. The result will be a maintainable, cost-effective adaptive learning tool.

## Key Algorithms and Pseudocode  

Below are the core algorithms in pseudocode form, highlighting how knowledge is extracted, how adaptive questions are generated, and how the feedback loop operates:

### 1. Knowledge Extraction from PDF  
```
function ExtractKnowledgeFromPDF(pdf_file):
    text_sections = PDFParser.extract_sections(pdf_file)  # split PDF into sections/chapters
    knowledge_base = []
    for section in text_sections:
        raw_text = section.text
        images = section.images  # any diagrams in this section
        # Optionally summarize or identify key points using an LLM (to assist question generation)
        summary = LLM.summarize(raw_text)  # (optional step)
        entry = {
            "section_title": section.title,
            "text": raw_text,
            "summary": summary,
            "images": images
        }
        knowledge_base.append(entry)
    store(knowledge_base)  # save to database or in-memory structure
    return knowledge_base
```
*Explanation:* The PDF is parsed into sections. For each section, we capture the text and any images. An LLM could generate a summary or list of key concepts (to help later in focusing questions). The output is stored in a knowledge base that the question generator can query. This algorithm ensures the content is prepared for quick lookup when generating questions. (In practice, one might also create embeddings for each section for semantic search if looking up by concept.)

### 2. Adaptive Question Generation Algorithm  
```
function GenerateNextQuestion(user_model):
    # Determine next topic and difficulty based on user model
    target_topic = user_model.get_lowest_mastery_topic()
    current_level = user_model.current_difficulty_level
    
    # Adjust difficulty: if user answered last few questions correctly, raise level, if struggling, lower it
    if user_model.recent_performance_good():
        current_level += 1
    elif user_model.recent_performance_poor():
        current_level = max(1, current_level - 1)
    user_model.current_difficulty_level = current_level
    
    # Fetch relevant content from knowledge base for the target topic
    content = KnowledgeBase.find(section_title=target_topic)
    context_text = content.text
    if current_level > THRESHOLD: 
        # If difficulty is high, perhaps use more obscure details or a larger context
        context_text = pick_more_detailed_excerpt(content, level=current_level)
    
    # Decide question format (regular MCQ vs coding) based on topic or content
    if content_is_programming_related(content):
        prompt = make_coding_question_prompt(content)
        model = CodeLLM  # use code generation model
    else:
        prompt = make_question_prompt(content, difficulty=current_level)
        model = QA_LLM  # use general model
    
    # Call LLM to generate question and answer
    model_output = LLMService.generate(model, prompt)
    question, correct_answer, options, solution_explanation = parse_question_output(model_output)
    
    # Package the question for delivery
    quiz_question = {
       "topic": target_topic,
       "difficulty": current_level,
       "question_text": question,
       "options": options,                # present if MCQ
       "correct_answer": correct_answer,  # may be an index or the answer text
       "solution_explanation": solution_explanation,
       "associated_image": content.images[0] if question_involves_diagram(question, content) else None
    }
    user_model.last_question_topic = target_topic
    return quiz_question
```
*Explanation:* This function decides what question to ask next. It looks at the `user_model` to find the topic the user is weakest in (lowest mastery). It also adjusts the difficulty level based on recent performance (simple heuristic shown – could be more sophisticated, e.g. using a moving average of correct answers). It then retrieves the relevant content for that topic from the knowledge base. Depending on the nature of that content, it might choose a coding question or a conceptual question. A prompt is constructed for the chosen LLM. After generation, the output is parsed into a structured question with the correct answer. If the question involves a diagram (detected perhaps by certain keywords or if the content had an image and the question references it), an image is attached for the frontend to display. The question is returned, ready to be sent to the user. This algorithm ensures adaptation (via topic selection and difficulty tuning) and uses the content to ground the question.

### 3. Feedback and Learning Loop Algorithm  
```
function ProcessUserAnswer(user_answer, correct_answer, question, user_model):
    # Evaluate correctness
    is_correct = False
    if question.type == "MCQ" or question.type == "True/False":
        if user_answer == correct_answer:
            is_correct = True
    elif question.type == "ShortAnswer":
        # For text answers, do a case-insensitive containment or semantic match
        is_correct = evaluate_text_answer(user_answer, correct_answer)
    elif question.type == "Coding":
        # Run code in sandbox and verify outputs
        results = CodeSandbox.run_tests(user_answer, question.test_cases)
        is_correct = results.all_tests_passed()
    # Update user model mastery and performance history
    topic = question.topic
    if is_correct:
        user_model.increment_mastery(topic)
        user_model.record_answer(question, correct=True)
    else:
        user_model.decrement_mastery(topic)
        user_model.record_answer(question, correct=False)
    
    # Prepare feedback
    if is_correct:
        feedback_msg = "Correct! " + (question.solution_explanation or "Well done.")
    else:
        feedback_msg = "Incorrect. The correct answer is: " + format(correct_answer) 
        if question.solution_explanation:
            feedback_msg += " – " + question.solution_explanation
    
    return feedback_msg, is_correct
```
*Explanation:* When a learner answers a question, this function evaluates the answer. Depending on the question type, the evaluation differs: for MCQ it’s a direct comparison, for open text a fuzzy match or even an LLM-based check (not shown here), and for coding questions running the code against test cases. The user’s mastery score for the relevant topic is then updated (simple approach: increment on correct, decrement on wrong – in practice one might use a more nuanced update). The user_model also logs this attempt (could store the question ID and correctness, to analyze patterns like streaks). Then a feedback message is generated. If an explanation for the solution exists (which was generated with the question), it’s included to help the learner understand the answer. This closes the loop for one question. After this, the system would call `GenerateNextQuestion` again to continue the session, thus continuously looping: generate question -> get answer -> update model -> feedback -> next question.

## UI/UX Design and Component Interaction  
![6e58a0f9-7848-4a5d-9d14-5726b8781214](https://github.com/user-attachments/assets/dfe6e516-1ed6-42e6-a462-dd8a6672b41a)

 *Figure: Example UI mock-up of the quiz interface.* The web application provides a clean, intuitive interface for the learner. As shown above, the quiz screen typically includes a progress indicator at the top (e.g. “Progress: 50%” in the example, possibly indicating how many questions have been completed or an estimated proficiency). The main panel presents the current question. In the mock-up example, we see an MCQ about computer architecture with a placeholder for a diagram on the left – the UI is capable of displaying an image alongside the question text. The multiple-choice options are listed clearly with radio buttons (A, B, C, D). The learner can select an option and click “Submit.”

Key UI elements and interactions:  
- **Progress Bar:** Gives visual feedback on how far along the quiz or mastery the learner is. This could reflect the number of questions answered or an adaptive score. It updates in real-time as the learner progresses.  
- **Question Display:** Shows the question text and any associated media. If it’s a diagram question, the image is displayed (with the ability to enlarge if needed). If it’s a coding question, this area might instead show a coding prompt and a code editor below it.  
- **Answer Input:** For MCQs, a simple list of options to choose from. For fill-in-the-blank or short answer, a text input box is shown. For coding, a text editor area is provided where the user writes their solution code. The UI should clearly indicate the type of response expected.  
- **Submit/Next Controls:** A button to submit the answer. After submission, the UI may temporarily disable inputs and show feedback. Upon correctness feedback, a “Next Question” button or an automatic transition brings in the next question. In an adaptive quiz, the transition is seamless so it feels like a continuous session.  
- **Feedback Modal/Area:** After answering, the UI can highlight the correct answer. For instance, if the user got it wrong, it might display a message in red with the correct answer and an explanation. This can appear below the question or in a pop-up. The explanation text is brief and learner-friendly, drawn from the solution explanation generated earlier.  
- **Adaptive Elements:** The UI may subtly reflect adaptiveness – e.g., if the system detects the user is struggling, it might show a encouraging message or allow an option to “review topic” (which could present a short summary of the concept before continuing). This is an extension to consider for user experience.  
- **Responsiveness:** The layout should adjust to smaller screens. On mobile, for example, the diagram might appear above the question text or the options might turn into a dropdown if space is tight. The design uses standard web responsive design practices.  

The component interaction between front-end and back-end works as follows for a typical question cycle: when the user clicks “Start Quiz” (perhaps after selecting which book or chapter to focus on), the frontend calls the backend API (e.g. GET `/next_question`). The backend responds with a JSON containing the question data (text, type, options, etc., and maybe an image URL or base64 string for diagrams). The frontend renders this. When the user submits an answer (or code), the frontend sends their response to POST `/submit_answer` with the question ID and answer. The backend processes it (evaluates correctness, updates model, generates feedback and next question). The response contains whether it was correct, the feedback message, and the next question. The frontend then displays the feedback to the user and loads the next question. This asynchronous exchange continues until some stopping condition (e.g. user ends the quiz or a certain number of questions have been answered).

Throughout the session, the UI remains interactive and provides the learner with a sense of progression and adaptation. The combination of text, images, and code interactions keeps the experience engaging. Despite the sophisticated back-end logic, the front-end flow is kept simple and straightforward for the learner.

## Potential Failure Modes and Mitigation Strategies  

When building an LLM-driven quiz system, several things could go wrong. Below are 5–7 possible sources of failure in question generation or learner evaluation, along with reflections on their likelihood. We then identify the most likely issues and propose logging/monitoring strategies to catch them early:

- **(F1) Factually Incorrect or Irrelevant Questions:** The LLM might generate a question or answer that doesn’t accurately reflect the textbook content. For instance, it might hallucinate a fact or ask about a concept not actually covered in the PDF. This undermines trust and learning value. *Likelihood:* High, if the LLM isn’t perfectly constrained by the source text (a known risk of generative models). Even when given context, models sometimes introduce errors or irrelevant details. *Logging:* For each generated question, log the source textbook snippet used and the question/answer. We can then run an offline script to compare the two – e.g., check if the correct answer string appears in the source text. If not, that’s a red flag the question may be hallucinated. During testing, enable a “verification mode” where the system highlights which part of source text justifies the answer. Any question lacking clear support in the source should be flagged. Additionally, have domain experts or instructors review a sample of generated questions; log their feedback to identify systematic issues (like a particular prompt leading to off-topic questions).  

- **(F2) Poorly Formed Questions (Quality Issues):** The question might be grammatically confusing, too easy (trivial), too hard, or have answer options that are obviously incorrect or all too similar. For example, the LLM might fail to produce four distinct multiple-choice options ([Generating multiple choice questions from a textbook: LLMs match human performance on most metrics](https://bpb-us-w2.wpmucdn.com/blogs.memphis.edu/dist/d/2954/files/2023/07/2023-olney-aied-workshop-macaw-mc-openstax.pdf#:~:text=inability%20to%20generate%20four%20distinct,overlap%20with%20the)), or the correct answer is obvious due to how options are phrased. *Likelihood:* Medium. LLMs are generally good at fluent output, but creating pedagogically sound distractors is challenging (one study found LLM-generated MCQs slightly lower quality on several metrics compared to human-made ones ([Generating multiple choice questions from a textbook: LLMs match human performance on most metrics](https://bpb-us-w2.wpmucdn.com/blogs.memphis.edu/dist/d/2954/files/2023/07/2023-olney-aied-workshop-macaw-mc-openstax.pdf#:~:text=presence%20in%20the%20options%2C%20distractor,topic%2C%20they%20were%20not%20precisely))). *Logging:* Implement a “quality check” on generated options: e.g., measure lexical similarity between the options – if an option is a near-duplicate of another or of the correct answer, log this event. Also log the length and complexity of each question; extremely short questions might indicate over-simplification. During beta testing, collect user feedback thumbs-up/down on each question, and log these ratings to identify problematic questions. This data will highlight if the LLM tends to, say, produce too-easy questions for certain topics, prompting adjustments in the difficulty prompts.

- **(F3) Adaptive Algorithm Missteps:** The logic that adjusts difficulty or picks topics could fail, resulting in a bad learning experience. For example, it might keep giving too-hard questions that the learner keeps getting wrong (not actually adapting downwards), or it might focus too long on one topic and never cover others (getting “stuck”). *Likelihood:* Medium. This depends on careful tuning; however, algorithmic bugs or edge cases (e.g. if a user gets a streak of wrong answers, does the system over-correct or under-correct?) are plausible. *Logging:* Track a timeline of each user session: log the topic and difficulty of each question and whether it was answered correctly. With this log, we can visualize the difficulty trajectory for users. If we see many users with patterns like four wrong answers in a row with difficulty remaining high, that signals the adaptation isn’t responding properly. Or if a user answers everything correctly but difficulty never increases, that’s an issue. Logging the chosen topic each time can reveal if some topics are repeated too often or some never appear. These logs allow us to verify that the adaptation logic is behaving as expected (e.g., roughly aiming for a user to be at ~70% correct rate if optimally challenged, etc.). We can simulate user models offline with scripted correct/incorrect sequences to test the adaptation loop and adjust parameters before deployment.

- **(F4) Code Evaluation Errors:** In coding challenges, the system might incorrectly judge a correct solution as wrong or vice versa. This could happen if the test cases are insufficient or if the user’s code is correct but output formatting differences cause a mismatch. Conversely, a user might find a corner case the test didn’t cover, getting credit for a partially correct solution. *Likelihood:* Medium for edge cases. Automated judging is generally reliable with good test cases, but writing perfect test cases is hard. *Logging:* For each code submission, log the tests run and results. If a user fails a challenge but later feedback (or manual review) shows their answer was actually correct, that’s a problem with tests – log user attempts (code snapshots) so developers can analyze any false negatives. Similarly, log cases where users passed but later it’s found their code shouldn’t have (false positives). Also measure how often users attempt a coding question before success; if many require multiple tries or give up, perhaps the question or tests are too unclear – this can be derived from logs of submissions per question.

- **(F5) Context Limitations for LLM (Truncated Context):** If a textbook is very large, we may not feed all relevant info into the prompt for question generation due to context length limits. The model might then miss some nuance, yielding incomplete questions ([](https://ceur-ws.org/Vol-3909/Paper_22.pdf#:~:text=or%20create%20incomplete%20questions%20that,of%20competencies%20required%20by%20the)) ([](https://ceur-ws.org/Vol-3909/Paper_22.pdf#:~:text=educational%20programme,not%20sufficiently%20differentiated%20or%20plausible)). *Likelihood:* Low to medium, depending on how we implement retrieval. If using a good chunking and retrieval strategy, we can usually include enough context. But if a concept’s explanation is split across sections and we only retrieve one, the question might lack full context. *Logging:* Record the size of context provided to the LLM for each question and the length of its output. If we ever hit the token limit (prompt truncated), log a warning. We could also have the LLM echo which sections it used (by perhaps asking it to list key terms from context). If important pieces are consistently missing, that might show up in the question quality and be caught by the earlier “factual correctness” checks. Essentially, ensure our system logs whenever a source text had to be cut short to fit the prompt, so we know the reliability might be lower for those questions.

- **(F6) Domain Specialization Failures:** The LLM might not have enough expertise in a very niche textbook topic, leading to shallow or even incorrect questions in that domain ([](https://ceur-ws.org/Vol-3909/Paper_22.pdf#:~:text=3,create%20high%20cognitive%20level%20tasks)). For example, in medical or legal content, a general model might mix up terminology. *Likelihood:* Low for common domains (the model likely has seen similar content), higher for very specialized domains. *Logging:* Identify the domain of each textbook (could tag the content). Monitor user performance on those domain-specific questions – if even strong students (or an expert tester) find the questions off-base or too difficult, it might indicate the LLM isn’t doing well in that domain. Logging expert reviews by domain would catch this. If a certain textbook yields a high proportion of low-rated questions (via user feedback logs), consider fine-tuning the model on that domain or providing more context.

- **(F7) Bias or Inappropriate Content:** While less likely in straightforward textbooks, the LLM could introduce subtle biases or inappropriate phrasings in questions (e.g., gender stereotypes in distractors, etc.). This is a general risk with AI-generated content ([](https://ceur-ws.org/Vol-3909/Paper_22.pdf#:~:text=4,needs%2C%20which%20can%20limit%20the)). *Likelihood:* Low in this context (textbooks are curated content), but worth monitoring. *Logging:* Use automated scanners on generated content for flagged words or phrases (similar to a content filter). Also allow users to report any question they feel is inappropriate or biased; log these reports and review them to improve prompt instructions or apply post-filters on the LLM outputs.

**Most Likely Issues:** Among the above, the most probable failures are (F1) factually incorrect questions and (F2) low-quality questions (especially poor distractors or not truly testing the intended concept). These arise directly from the LLM generation process. Indeed, LLMs can formulate questions without truly understanding pedagogical intent, sometimes resulting in validity issues or guessable answers ([](https://ceur-ws.org/Vol-3909/Paper_22.pdf#:~:text=2,guessing%20the%20correct%20answer%20is)). We anticipate needing to refine prompts and perhaps implement validation heuristics as described. The adaptive algorithm (F3) is also a concern, but since it’s under our direct control (not an unpredictable AI output), we can more deterministically test and fix it – still, we will keep a close eye via the logging strategies described.

**Logging Strategies to Validate Assumptions:** To ensure we catch these issues early, we will implement a robust logging and analysis pipeline from day one. For example, we assume the LLM will stick to the provided context (minimizing hallucinations) – to validate this, we log each Q&A pair with the context and run a nightly script that cross-checks them. We assume our difficulty adjustment keeps the user at a ~70% success rate; we’ll validate by logging each session’s running success rate and see if it hovers around that. All logs will be aggregated and visualized in a dashboard for the development team. By monitoring these, we can validate or challenge our design assumptions quickly, before deploying to real students. This proactive logging and analysis is crucial given the stochastic nature of LLMs – it allows us to iterate on prompts, models, or algorithms with real data, thereby increasing the reliability of the Evaluation Module prior to full deployment.

