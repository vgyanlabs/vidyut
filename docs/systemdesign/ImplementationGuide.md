# Features
- PDF ingestion and knowledge extraction module
- Mock LLM responses for question generation
- Adaptive quiz engine with mastery tracking
- SQLite-based user and knowledge database
- Code evaluation stub (mocked)

I’ll also provide step-by-step instructions to run and test it locally. I’ll let you know once everything is ready.

# FastAPI Evaluation Module Implementation

## Overview

This solution implements a **FastAPI** backend for an "Evaluation Module" that ingests PDF content, generates mock questions, and provides an adaptive quiz experience. It uses **Python 3** with FastAPI for the web framework and **SQLite** for persistent data storage. Key features include:

- **PDF Ingestion**: Upload a PDF textbook, parse it into sections (with titles, text, and optional images), and store them in a SQLite knowledge base.
- **Question Generation**: Create plausible quiz questions for each section, simulating LLM-generated questions (hardcoded or randomized based on the section content).
- **Adaptive Quiz Engine**: Track user progress and mastery per topic. The next question is selected from the user's weakest topic (or an unattempted topic) and difficulty adjusts (e.g. moving to a harder question for a topic after an easy one is answered correctly). 
- **Code Challenge Support**: Include a coding question type with dummy evaluation (simulating test cases pass/fail without real code execution).
- **REST API Endpoints**: Provide endpoints to upload PDFs, get the next question, submit an answer, and check user progress. These can be tested via curl or Postman.

The code is organized in a modular, extensible way. For example, the question generation and answer evaluation are abstracted so they can later be replaced with real LLM calls or a proper judging system without changing the API. The backend is stateless between requests (aside from the database), so it can easily integrate with frontends or be scaled.

## Technology Stack and Data Model

**FastAPI** is used to define the web API. We use `UploadFile` for file uploads (multipart form data) ([Build a PDF Text Extractor with FastAPI & MongoDB | by Saverio Mazza | Medium](https://medium.com/@saverio3107/build-a-pdf-text-extractor-with-fastapi-mongodb-50cbae2c2db5#:~:text=async%20def%20process_pdf_file,filename%2C%20%27wb%27%29%20as%20f)) and standard JSON endpoints for other operations. **SQLite** is chosen for simplicity and persistence; it stores the parsed content and user progress. The database has three main tables:

- **Sections** – stores sections of the textbook (each representing a topic):
  - `id` (PK), `title` (section title), `text` (section content text), `type` (`"text"` or `"code"`), and `images` (optional image file paths associated with the section).
- **Questions** – stores generated questions based on sections:
  - `id` (PK), `section_id` (FK to Sections), `question_text`, `type` (`"text"` or `"code"`), `difficulty` (e.g. 1 = easy, 2 = hard), and an `expected_answer` (for text questions, a reference answer or keywords to check; for code, this can be blank or dummy criteria).
- **UserProgress** – tracks per-user performance on each section:
  - `user_id`, `section_id` and counters for `attempts` and `correct` answers. This helps compute mastery and choose the next question adaptively.

All interactions (PDF parsing, question generation, quiz logic) happen server-side, so the client (or frontend) only needs to call the API and handle the responses.

## PDF Ingestion Module

The **`POST /upload_pdf`** endpoint handles PDF ingestion. When a PDF file is uploaded, the backend will:

1. **Parse the PDF into sections**: We use a Python PDF library (e.g. PyMuPDF or PyPDF2) to extract text from the PDF ([Build a PDF Text Extractor with FastAPI & MongoDB | by Saverio Mazza | Medium](https://medium.com/@saverio3107/build-a-pdf-text-extractor-with-fastapi-mongodb-50cbae2c2db5#:~:text=text%20%2B%3D%20pdf_reader)). The text is split into logical sections (with titles and body text). We detect section titles either via the PDF's table of contents (if available) or by simple heuristics (like lines that look like headings). For example, lines that start with "Chapter X" or "Section Y", or are in title-case followed by a block of text, are treated as section titles. Each section is stored with a title and its full text content.
2. **Extract images (optional)**: If the PDF contains images (figures, diagrams), the ingestion process can extract those as well. Using PyMuPDF, we can identify images by their object reference and save them to disk (e.g. in an `images/` directory). The file paths or names of these images are stored in the section record so they can be referenced later. (For simplicity, our implementation will save images as files like `image_<xref>.png` and store the filenames in the section's `images` field.)
3. **Store in SQLite**: The parsed sections are inserted into the **Sections** table of the SQLite database. Each section record includes the title, text, type (`"text"` for normal sections; we will also insert a `"code"` type section for the coding challenge question as described later), and any image references. In our implementation, uploading a new PDF will **reset** the existing knowledge base (clearing previous sections, questions, and user progress) to avoid mixing content.

**Section Parsing Logic:** We implement a function to parse the PDF. It tries to use the PDF’s outline (table of contents) if present to get section titles and page ranges. If no outline is available, it falls back to scanning the text for headings. For example, if a page’s first line is "Chapter 3: Thermodynamics", we treat that as a new section title and all subsequent text (until the next title) as that section’s content. This way, a textbook PDF is split into sections such as *"Chapter 1: Introduction"* with its text, *"Chapter 2: Basics"* with its text, etc. Each section can span multiple pages (the parser accumulates text until a new title is found).

> **Note:** The parsing uses basic heuristics and may not perfectly handle every PDF’s formatting. In a real system, one might integrate a library or ML model to more robustly detect section breaks, or allow manual tagging. For our purposes, this provides a reasonable simulation of a "knowledge base" populated from the PDF.

## Question Generation Module (Mock LLM)

After storing sections, the **upload process also generates quiz questions** from each section to populate the **Questions** table. This simulates using an LLM to create questions based on content, but here we use deterministic logic:

- For each text section, we generate one or two questions:
  - **Easy question** (difficulty 1): A basic question about the section’s main idea. For example, if the section title is "Introduction to Algebra", the question might be *"What are the key points covered in the \"Introduction to Algebra\" section?"*. This prompts the user to recall or summarize the main content. We might phrase it as "What are the key points of \<Topic\>?" or "Explain the concept of \<Topic\>." (where \<Topic\> is the section title without any numbering). This is a straightforward question answerable directly from the section text.
  - **Hard question** (difficulty 2): A more in-depth or applied question on the same topic. For example, *"Provide a detailed explanation of the concepts in \"Introduction to Algebra\"."* This expects a deeper or more comprehensive answer. (In practice, this could involve asking *why* the concept is important, or an application scenario, but our simple implementation will use a generic prompt like "Discuss \<Topic\> in detail.") This second question is only generated if there is enough content in the section to justify a harder question.
- For the coding challenge section (if added), we generate a coding task:
  - The question text is basically the prompt for the coding challenge (e.g. *"Write a function to add two numbers and return the result."*). We mark this question’s type as `"code"`. In a real scenario, we might have multiple test cases or a solution, but here we will use a dummy check (for example, simply checking if the user’s answer contains a certain keyword or pattern) to decide pass/fail.

All generated questions are stored in the **Questions** table with references to their section and a difficulty level. We also store an `expected_answer` for text questions, which can be a short reference answer or keywords extracted from the section. For instance, we might take the first sentence of the section text as a rough expected answer for the summary question. This helps in mock evaluation (by checking if the user’s answer contains some of those keywords). For coding questions, `expected_answer` can be left null or contain a hint (our evaluation logic for code will be hardcoded separately).

By storing questions in the database, the system ensures the same questions are reused for consistency, and it can track which questions each user has seen or answered correctly. (In this simple setup, we assume one question per difficulty per section.)

**Mock LLM**: Since we are not actually calling an LLM, the question generation is rule-based and limited. However, the code is organized so that you can later replace the question generation function with a real LLM call (e.g., GPT-4) that reads the section text and creates a question. Similarly, the answer evaluation can be swapped out for an AI-based solution or more complex logic without changing the API.

## Adaptive Quiz Engine

Once the knowledge base (sections + questions) is prepared, users can start answering questions via the quiz endpoints. The **adaptive quiz engine** works as follows:

- The system tracks **user performance per topic (section)**. Each section is considered a topic to master. In the `UserProgress` table, we record how many times a user has attempted questions from that section and how many were answered correctly.
- **Selecting the next question (GET `/next_question`)**:
  - If the user is new (no progress yet) or there are sections they haven’t seen at all, the engine will select an unattempted topic first. (This ensures coverage of all topics.) For example, if there are 5 sections in the PDF and the user has not answered any questions yet, the first five questions they get will each be from a different section, introducing each topic.
  - If the user has attempted all topics at least once, or after the initial round, the engine then picks the topic where the user’s mastery is weakest. We quantify *mastery* simply by the fraction of questions answered correctly for that section (or by whether the topic’s questions have been answered correctly at all).
  - In practice, this means the engine finds the section with the lowest success rate (or that still has unanswered questions). For example, if a user got Section A’s question right (100% on A so far) but Section B’s question wrong (0% on B), then the next question will focus on Section B (the weakest topic). This implements an adaptive approach: the quiz dynamically targets areas where the learner needs improvement, rather than just going in a fixed order.
  - If multiple topics are equally weak, we can choose one of them (e.g. the one with fewest attempts or at random) to present next.
  - **Adjusting difficulty**: The engine also adjusts question difficulty based on past performance in that topic. Typically, a user will receive the easy question for a topic first. If they answer it correctly, the next time that topic is served (when the system revisits it as a weak topic or in a review cycle), a harder question will be given. Conversely, if they answered incorrectly on an easy question, the system might continue to give easy questions (or repeat the question) until they get it right (since they haven’t demonstrated mastery yet). In our implementation, each section has at most two questions (one easy, one hard). The logic is: **if the user has not answered any question correctly for that section yet, serve the easy question; if they have already answered the easy one correctly and a hard question exists, then serve the hard question next time.** This way, the difficulty “levels up” only after mastering the easier level.
  - The coding challenge is treated as another topic in this system. If included, a user who hasn’t done the coding question will eventually get it as an unattempted topic. The difficulty concept for code questions can be analogous (we could have multiple coding tasks per topic), but for simplicity we include just one coding question.
- **Answer evaluation (POST `/submit_answer`)**:
  - When a user submits an answer, the system evaluates it and updates the database. For a text question, the evaluation is a *mock* check – we might do a simple keyword match against the expected answer. For example, if the expected answer for "What are the key points of Photosynthesis?" contains the keywords "sunlight" and "chlorophyll", the evaluation might check if the user's answer includes those words. If yes (or if it matches sufficiently), we mark it as correct. Otherwise, it's incorrect. (The current implementation is simplistic: if the answer contains at least one or two important words from the expected answer, we consider it correct – since we don't have a real grader. Alternatively, one could mark correctness randomly to simulate variability, but we'll use a keyword approach for determinism.)
  - For a code question, the evaluation simulates running test cases. We won't execute the code for real; instead, we'll use a dummy rule. For example, if the task is to add two numbers, we might simply check if the submitted code string contains a `'+'` character (assuming that a correct solution would use addition). If it does, we declare the "tests passed." If not, we say it failed. This is obviously a placeholder (real evaluation would involve running the code against test cases), but it demonstrates the endpoint's behavior. You could imagine expanding this by actually running the code in a sandbox or using a service to judge code in the future.
  - The result of evaluation (correct or incorrect) is then used to update the UserProgress record for that section: increment the attempt count, and if correct, increment the correct count. This data will influence the next question selection as described.
  - The `/submit_answer` response will include whether the answer was correct, and possibly a brief feedback message. For example, for a code question it might return `{"correct": false, "message": "Your code failed some test cases."}` or if correct: `{"correct": true, "message": "All test cases passed."}`. For a text question, it might simply confirm correctness or encourage review if wrong. (We could also return the correct answer or an explanation for learning purposes, but that is optional and not asked in the prompt.)
- **User progress (GET `/user_progress`)**: This endpoint returns an overview of the user’s performance so far. It can list each topic with how many questions were attempted and how many answered correctly, and perhaps a derived mastery level. For instance, if a user has answered 1 out of 2 questions for a topic correctly, that might be 50% mastery. We can also assign qualitative statuses: *Not Attempted* (0 attempts), *Struggling* (attempts made but no correct answers), *In Progress* (some correct, some wrong), or *Mastered* (all questions for that topic answered correctly). This helps both the user and the system understand which topics need more work. The progress data can be used by a frontend to display a progress dashboard or by the engine to decide when a user has achieved sufficient mastery to perhaps end the quiz.

Overall, this adaptive approach ensures that the quiz is personalized: it gives more practice on topics the user hasn't mastered and increases difficulty appropriately to challenge the user. The design is kept simple here (e.g., we don't implement complex Item Response Theory or statistical modeling of ability), but the structure allows for more sophisticated algorithms to be integrated later.

## API Endpoints

The backend provides the following endpoints:

- **`POST /upload_pdf`** – Ingest a PDF textbook. The request should be a multipart form-data upload with a file field (e.g., using an HTML form or sending via Postman/curl). The endpoint parses the PDF, stores sections and questions in the database, and returns a summary (such as how many sections and questions were created). This would typically be used by an instructor or an admin to load content into the system. (No authentication is included in this simple implementation.)
- **`GET /next_question?user_id={id}`** – Get the next question for the given user. The client supplies a `user_id` (an identifier for the user – it can be a simple string or number). If the user is new or has no progress yet, an entry is created for them. The response will include the next question to present, including an ID, the question text, the type of question (so the frontend knows how to render it), and maybe the difficulty or any other relevant info (our code includes difficulty mainly for internal logic). The client can use this information to display the question to the user. Each call computes the next best question based on current user performance (as described in the adaptive engine logic).
- **`POST /submit_answer`** – Submit an answer for evaluation. The request body should contain the `user_id`, the `question_id` (so the system knows which question the user answered), and the `answer` itself (as text). The backend will evaluate the answer (mock evaluation) and update the user's progress. The response will indicate whether the answer was correct and include any feedback message. After submitting, the client can either automatically call `/next_question` to get a new question or let the user decide to continue.
- **`GET /user_progress?user_id={id}`** – Retrieve the user’s progress. This returns a summary of performance per topic for the user. For example, it can return a JSON with each section title, number of attempts, number correct, accuracy percentage, and a mastery status. This can be used to display progress or to let the user know which topics they might need to review. It’s also useful for debugging or verifying that the adaptivity logic is working (by seeing the counts change).

Each endpoint will be demonstrated with example usage in the testing guide. No front-end UI is implemented here; you can interact with these endpoints using curl, HTTPie, Postman, or integrate with a frontend of your choice. The API returns JSON for all GET/POST calls (except the file upload which returns JSON summary as well). 

Now, let's dive into the implementation with code. The code below is a single-file FastAPI application that fulfills the above requirements. It is annotated with comments for clarity and organization.

## Implementation Code

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import sqlite3
import fitz  # PyMuPDF for PDF parsing
import re, os, json

app = FastAPI(title="Evaluation Module API")

# --- Database initialization (SQLite) ---
DB_PATH = "evaluation.db"

# Helper to initialize database tables
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Enable foreign keys in SQLite
    cur.execute("PRAGMA foreign_keys = ON;")
    # Create Sections table
    cur.execute("""CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY,
        title TEXT,
        text TEXT,
        type TEXT,
        images TEXT
    );""")
    # Create Questions table
    cur.execute("""CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY,
        section_id INTEGER,
        question_text TEXT,
        type TEXT,
        difficulty INTEGER,
        expected_answer TEXT,
        FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
    );""")
    # Create UserProgress table (composite primary key on user_id and section_id)
    cur.execute("""CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT,
        section_id INTEGER,
        attempts INTEGER,
        correct INTEGER,
        PRIMARY KEY (user_id, section_id),
        FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
    );""")
    conn.commit()
    conn.close()

# Call init_db at startup to ensure tables exist
@app.on_event("startup")
def startup_event():
    init_db()

# --- PDF Parsing and Ingestion ---
def parse_pdf_sections(file_bytes: bytes):
    """
    Parse the PDF file (given as bytes) into sections.
    Returns a list of sections, where each section is a dict with 'title', 'text', 'type', 'images'.
    """
    sections = []
    # Open PDF from bytes
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    # Try to use the Table of Contents (TOC) if available
    toc = doc.get_toc()  # list of [level, title, page]
    # Normalize titles by stripping line breaks and extra spaces
    def clean_title(t):
        return " ".join(t.split())
    if toc:
        # Determine deepest level in TOC
        levels = [entry[0] for entry in toc]
        max_level = max(levels)
        # We choose the lowest level (deepest) for sections to get granular topics
        # e.g., if level 2 exists, we use level 2 entries as sections; if not, use level 1.
        target_level = max_level if max_level > 1 else 1
        toc_sections = [entry for entry in toc if entry[0] == target_level]
        for idx, entry in enumerate(toc_sections):
            _, title, start_page = entry
            title = clean_title(title)
            # Calculate end_page (one before the next section's start, or end of doc)
            if idx < len(toc_sections) - 1:
                end_page = toc_sections[idx+1][2] - 1
            else:
                end_page = doc.page_count  # last section goes till end
            # Extract text from start_page to end_page (1-indexed pages in TOC)
            content_text = ""
            for p in range(start_page - 1, end_page):  # convert to 0-index
                content_text += doc.load_page(p).get_text()
            content_text = content_text.strip()
            if content_text == "":
                continue  # skip if no text (unlikely)
            sections.append({
                "title": title,
                "text": content_text,
                "type": "text",
                "images": []  # will fill below
            })
    else:
        # No TOC available, use heuristic parsing by scanning for headings
        current_section = None
        current_title = None
        current_text = ""
        current_images = []
        section_count = 0
        for page_number in range(doc.page_count):
            page = doc.load_page(page_number)
            text = page.get_text().strip()
            if text == "":
                continue
            lines = text.splitlines()
            if len(lines) == 0:
                continue
            first_line = lines[0].strip()
            # Heuristic for heading:
            # Consider it a new section if the first line indicates a title (contains "Chapter" or "Section" or ends with ":" or is short compared to next line).
            is_heading = False
            if re.match(r'^(Chapter|Section)\b', first_line, flags=re.IGNORECASE) or first_line.endswith(":"):
                is_heading = True
            elif len(first_line.split()) <= 5 and len(lines) > 1:
                # If first line is very short and second line is much longer, treat first line as heading
                if len(lines[1].split()) > len(first_line.split()) * 2:
                    is_heading = True
            if is_heading:
                # Save the previous section if exists
                if current_title:
                    sections.append({
                        "title": clean_title(current_title),
                        "text": current_text.strip(),
                        "type": "text",
                        "images": current_images
                    })
                # Start a new section
                section_count += 1
                current_title = first_line
                # Section text starts after the heading line
                current_text = "\n".join(lines[1:]) + "\n"
                current_images = []
            else:
                # If no new heading, append this page's text to current section
                if not current_title:
                    # If we haven't started a section yet (first page has no clear heading),
                    # create a default section title.
                    section_count += 1
                    current_title = f"Section {section_count}"
                    current_text = ""
                    current_images = []
                current_text += text + "\n"
            # Extract images on this page and associate with current section
            image_list = page.get_images(full=True)
            # image_list is a list of tuples with image metadata; each tuple's first element is the xref (id)
            for img in image_list:
                xref = img[0]
                try:
                    pix = doc.extract_image(xref)
                except Exception:
                    continue  # skip if extraction fails
                img_bytes = pix["image"]
                ext = pix["ext"] or "png"
                img_filename = f"image_{page_number+1}_{xref}.{ext}"
                # Save image bytes to file
                os.makedirs("images", exist_ok=True)
                with open(os.path.join("images", img_filename), "wb") as f:
                    f.write(img_bytes)
                current_images.append(img_filename)
        # After looping pages, add the last section
        if current_title:
            sections.append({
                "title": clean_title(current_title),
                "text": current_text.strip(),
                "type": "text",
                "images": current_images
            })
    # Close PDF document
    doc.close()
    return sections

def generate_questions_for_section(section):
    """
    Given a section dict with 'title', 'text', and 'type', generate question(s) for it.
    Returns a list of question dicts with 'question_text', 'type', 'difficulty', 'expected_answer'.
    """
    title = section["title"]
    text = section["text"]
    sec_type = section.get("type", "text")
    questions = []
    if sec_type == "text":
        # Formulate an easy question (difficulty 1)
        topic = title
        # Remove leading "Chapter/Section X: " from topic for readability
        topic = re.sub(r'^(Chapter|Section)\s*\d+(\.\d+)*:?\s*', '', topic, flags=re.IGNORECASE)
        if topic == "":
            topic = title  # fallback to original if it becomes empty
        # Q1: ask for key points or summary
        q1 = f'What are the key points covered in the "{topic}" section?'
        # Expected answer: take the first sentence or two of the section text as a reference
        sentences = re.split(r'(?<=[.!?]) +', text)
        expected = sentences[0] if sentences else text
        if len(expected) > 150:
            expected = expected[:150]  # truncate overly long expected answer
        questions.append({
            "question_text": q1,
            "type": "text",
            "difficulty": 1,
            "expected_answer": expected.strip()
        })
        # Q2: formulate a harder question if content is substantial
        if len(text.split()) > 50:  # if section text has more than 50 words, we assume we can ask a detailed question
            q2 = f'Provide a detailed explanation of the concepts in "{topic}".'
            # For expected answer of hard question, maybe take more content (first few sentences)
            expected2 = " ".join(sentences[:2]) if len(sentences) > 1 else expected
            questions.append({
                "question_text": q2,
                "type": "text",
                "difficulty": 2,
                "expected_answer": expected2.strip()
            })
    elif sec_type == "code":
        # For a code section, the section 'text' itself might be the prompt
        q = section["text"]
        questions.append({
            "question_text": q,
            "type": "code",
            "difficulty": 1,
            "expected_answer": ""  # we can leave expected_answer empty or put dummy criteria
        })
    return questions

@app.post("/upload_pdf")
async def upload_pdf(pdf_file: UploadFile = File(...)):
    """
    Upload a PDF file to ingest its content. Returns number of sections and questions added.
    This will reset the current knowledge base.
    """
    # Read file bytes
    contents = await pdf_file.read()
    # Initialize (or reset) the database
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Clear existing data (in case the tables were not empty)
    cur.execute("DELETE FROM sections;")
    cur.execute("DELETE FROM questions;")
    cur.execute("DELETE FROM user_progress;")
    conn.commit()
    # Parse PDF into sections
    try:
        sections = parse_pdf_sections(contents)
    except Exception as e:
        conn.close()
        return JSONResponse(status_code=500, content={"error": f"Failed to parse PDF: {str(e)}"})
    section_count = 0
    question_count = 0
    # Insert each section and its questions
    for sec in sections:
        section_count += 1
        # Insert section into DB
        cur.execute("INSERT INTO sections (title, text, type, images) VALUES (?, ?, ?, ?);",
                    (sec["title"], sec["text"], sec.get("type", "text"), json.dumps(sec.get("images", []))))
        section_id = cur.lastrowid
        # Generate questions for this section
        qs = generate_questions_for_section(sec)
        for q in qs:
            question_count += 1
            cur.execute("INSERT INTO questions (section_id, question_text, type, difficulty, expected_answer) VALUES (?, ?, ?, ?, ?);",
                        (section_id, q["question_text"], q["type"], q["difficulty"], q.get("expected_answer", "")))
    # Also, include a predefined coding challenge (if not already included)
    # For demonstration, let's add a coding section manually if not present.
    # (This could also be part of the PDF or separate content.)
    code_section_title = "Coding Challenge: Add Two Numbers"
    code_prompt = "Write a function to add two numbers and return the result."
    cur.execute("INSERT INTO sections (title, text, type, images) VALUES (?, ?, ?, ?);",
                (code_section_title, code_prompt, "code", "[]"))
    code_section_id = cur.lastrowid
    # One question for the coding challenge (the prompt itself)
    question_count += 1
    cur.execute("INSERT INTO questions (section_id, question_text, type, difficulty, expected_answer) VALUES (?, ?, ?, ?, ?);",
                (code_section_id, code_prompt, "code", 1, ""))  # expected_answer not needed for code
    conn.commit()
    conn.close()
    return {"sections_added": section_count + 1, "questions_added": question_count}  # +1 for the coding section

# --- Adaptive Quiz Endpoints ---

@app.get("/next_question")
def next_question(user_id: str):
    """
    Get the next question for the user. Chooses the weakest or new topic for adaptivity.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # If user has no progress yet (new user), ensure at least an entry or detect that
    cur.execute("SELECT * FROM user_progress WHERE user_id = ?;", (user_id,))
    user_records = cur.fetchall()
    if len(user_records) == 0:
        # New user: no progress entries. We don't create blank entries for all sections yet; we'll add as they attempt.
        pass
    # Determine the next section/topic to get a question from
    # Strategy:
    # 1. Find any section that user has not attempted yet.
    cur.execute("SELECT id, title FROM sections;")
    all_sections = cur.fetchall()
    attempted_section_ids = {row["section_id"] for row in user_records}
    target_section_id = None
    target_question = None
    # Prefer an unattempted section first
    for sec in all_sections:
        if sec["id"] not in attempted_section_ids:
            target_section_id = sec["id"]
            break
    if target_section_id is None:
        # All sections attempted at least once. Find section with lowest accuracy (correct/total).
        weakest_section = None
        lowest_score = 1.1  # start above max (100%)
        # Calculate accuracy for each section attempted
        for record in user_records:
            sec_id = record["section_id"]
            # Get total questions available for this section (to consider unanswered as well)
            cur.execute("SELECT COUNT(*) FROM questions WHERE section_id = ?;", (sec_id,))
            total_q = cur.fetchone()[0]
            correct = record["correct"]
            # Compute accuracy as correct/total questions (even if not all attempted yet)
            accuracy = correct / total_q if total_q > 0 else 0.0
            if accuracy < lowest_score:
                lowest_score = accuracy
                weakest_section = sec_id
        target_section_id = weakest_section
    # Now we have target_section_id to focus on.
    # Determine which question (difficulty) to serve from that section.
    # Get user's progress for that section
    cur.execute("SELECT * FROM user_progress WHERE user_id = ? AND section_id = ?;", (user_id, target_section_id))
    progress = cur.fetchone()
    correct_count = 0
    attempts = 0
    if progress:
        correct_count = progress["correct"]
        attempts = progress["attempts"]
    # Fetch questions for that section sorted by difficulty
    cur.execute("SELECT * FROM questions WHERE section_id = ? ORDER BY difficulty ASC;", (target_section_id,))
    questions = cur.fetchall()
    if not questions:
        conn.close()
        return {"error": "No questions available for the selected topic."}
    # Decide which question to ask:
    # If user hasn't answered any correctly yet (or never attempted), give the first (easiest) question.
    # If user got the first one correct and a second exists, give the second (harder).
    # If user got one wrong but others exist, we could still give the next one or repeat - here we give next if not tried yet.
    if correct_count >= len(questions):
        # If somehow user already answered all questions correctly, just return the last question as a fallback.
        target_question = questions[-1]
    elif correct_count == 0:
        # No correct answers yet for this section
        # If no attempts at all or only wrong attempts, still start/continue with easiest question (index 0).
        target_question = questions[0]
    else:
        # User has some correct (likely the easy one). Give the next unanswered question.
        # e.g., if correct_count == 1 and there is a second question:
        idx = min(correct_count, len(questions)-1)  # this will be 1 if they answered one correctly
        target_question = questions[idx]
    # Prepare response
    question_id = target_question["id"]
    q_text = target_question["question_text"]
    q_type = target_question["type"]
    # (difficulty could be included too if needed)
    response = {"question_id": question_id, "question_text": q_text, "type": q_type}
    conn.close()
    return response

@app.post("/submit_answer")
def submit_answer(user_id: str, question_id: int, answer: str):
    """
    Submit an answer for a given question. Returns whether it's correct and updates progress.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # Retrieve the question and associated section
    cur.execute("SELECT q.question_text, q.type, q.difficulty, q.expected_answer, q.section_id, s.title, s.type as section_type FROM questions q JOIN sections s ON q.section_id = s.id WHERE q.id = ?;", (question_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        return JSONResponse(status_code=400, content={"error": "Question not found"})
    section_id = q["section_id"]
    q_type = q["type"]
    correct = False
    feedback = ""
    # Evaluate based on type
    if q_type == "text":
        # Simple keyword-based evaluation
        expected = q["expected_answer"] or ""
        # Normalize answer and expected for comparison
        ans_lower = answer.lower()
        exp_lower = expected.lower()
        # Check if at least one important keyword from expected is in answer
        # We'll take words >4 letters from expected as keywords
        keywords = [w for w in re.findall(r"\w+", exp_lower) if len(w) > 4]
        match_count = sum(1 for w in keywords if w in ans_lower)
        if keywords:
            # require at least 1/3 of keywords (or at least 1) to consider correct
            threshold = max(1, len(keywords) // 3)
            if match_count >= threshold:
                correct = True
        else:
            # if we have no keywords (expected answer very short), just check non-empty answer
            if answer.strip():
                correct = True
        feedback = "Correct!" if correct else "Incorrect. Please review the section and try again."
    elif q_type == "code":
        # Dummy code evaluation: e.g., for "add two numbers", check if answer contains a '+' sign
        # (In a real system, we would run the code against test cases.)
        task_title = q["title"] if "title" in q else ""  # section title might describe task
        code_answer = answer.replace(" ", "").lower()
        if "+" in code_answer:
            correct = True
            feedback = "All test cases passed."
        else:
            correct = False
            feedback = "Your code failed some test cases."
    else:
        # Other question types could be handled here (e.g., multiple-choice), not needed for now.
        if answer.strip():
            correct = True
            feedback = "Answer received."
    # Update user progress in database
    # Check if an entry exists for this user and section
    cur.execute("SELECT attempts, correct FROM user_progress WHERE user_id = ? AND section_id = ?;", (user_id, section_id))
    record = cur.fetchone()
    if record:
        new_attempts = record["attempts"] + 1
        new_correct = record["correct"] + (1 if correct else 0)
        cur.execute("UPDATE user_progress SET attempts = ?, correct = ? WHERE user_id = ? AND section_id = ?;",
                    (new_attempts, new_correct, user_id, section_id))
    else:
        cur.execute("INSERT INTO user_progress (user_id, section_id, attempts, correct) VALUES (?, ?, ?, ?);",
                    (user_id, section_id, 1, 1 if correct else 0))
    conn.commit()
    conn.close()
    return {"correct": correct, "message": feedback}

@app.get("/user_progress")
def user_progress(user_id: str):
    """
    Get the progress of the given user across all topics.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # Join sections with user_progress to get titles and stats. Use LEFT JOIN to include sections not attempted.
    cur.execute("""SELECT s.title, s.type as section_type, IFNULL(up.attempts, 0) as attempts, IFNULL(up.correct, 0) as correct,
                          (CASE 
                              WHEN up.attempts IS NULL THEN 'Not Attempted'
                              WHEN up.correct = 0 AND up.attempts > 0 THEN 'Struggling'
                              WHEN up.correct >= (SELECT COUNT(*) FROM questions q WHERE q.section_id = s.id) THEN 'Mastered'
                              ELSE 'In Progress'
                           END) as mastery_status
                   FROM sections s
                   LEFT JOIN user_progress up 
                   ON up.section_id = s.id AND up.user_id = ?;""", (user_id,))
    results = cur.fetchall()
    conn.close()
    # Format output
    progress_list = []
    for row in results:
        # Calculate accuracy percentage if attempted
        accuracy = None
        if row["attempts"] and row["attempts"] > 0:
            accuracy = f"{int(row['correct'] / row['attempts'] * 100)}%"
        progress_list.append({
            "topic": row["title"],
            "attempts": row["attempts"],
            "correct": row["correct"],
            "accuracy": accuracy if accuracy is not None else "N/A",
            "mastery": row["mastery_status"]
        })
    return {"user_id": user_id, "topics": progress_list}
```

The code above defines the FastAPI app and all required endpoints:

- The **database setup** is done in `init_db()` and called on startup. We create tables for sections, questions, and user_progress with the schema described. We ensure foreign keys are enabled so that if we ever delete a section, its questions and progress could cascade (though we manually delete in this design).
- In **`/upload_pdf`**:
  - We read the uploaded file (using `await pdf_file.read()` as shown in FastAPI docs ([Build a PDF Text Extractor with FastAPI & MongoDB | by Saverio Mazza | Medium](https://medium.com/@saverio3107/build-a-pdf-text-extractor-with-fastapi-mongodb-50cbae2c2db5#:~:text=async%20def%20process_pdf_file,filename%2C%20%27wb%27%29%20as%20f))) and then re-initialize the database (clearing old data).
  - We parse the PDF using `parse_pdf_sections(contents)`. This function uses PyMuPDF (`fitz`) to open the PDF and extract sections either via TOC or heuristics. We take care to gather images as well, saving them to an `images/` directory and listing their filenames.
  - Each section is inserted into the `sections` table. After that, we call `generate_questions_for_section` to get questions, and insert those into `questions` table. We count sections and questions for the response.
  - We also inject a coding challenge section at the end (hardcoded) to ensure a code question is present in the system. (This is an extra step to fulfill the requirement of a code challenge, even if the PDF itself might not have one. In a real scenario, code questions might come from the PDF or a separate question bank. Here it's just one example question.)
  - The endpoint returns the number of sections and questions added, as a confirmation. (It could also return section titles or other info if needed.)
- In **`/next_question`**:
  - We identify the next question to ask the user. The logic goes through the user's progress and all sections as described. We prefer an unattempted section, otherwise the section with lowest performance.
  - Then, we determine which question in that section to ask (based on difficulty and what they have gotten correct so far). We retrieve all questions for the section from the DB, sort by difficulty, and pick the appropriate one. The result includes `question_id`, `question_text`, and `type` (so the client knows if it's a code question to maybe show a code editor, etc.).
  - If the user was completely new, our logic just picks the first unattempted section (which would be the first section in the DB). If the DB insertion preserved order of the PDF, that would usually be the first chapter.
- In **`/submit_answer`**:
  - We evaluate the submitted answer. We look up the question by ID, get its type, expected answer (if any), and the section it belongs to.
  - Based on the type:
    - For text, we do a simple keyword matching against the expected answer. We define "keywords" as words longer than 4 letters from the expected answer and check if the user's answer contains a few of those. If yes, we mark correct. (This is a naive approach just to simulate checking content.)
    - For code, we implement a dummy check (here, looking for a `'+'` in the answer for the addition problem). If found, we assume the solution is correct. We then set a feedback message accordingly.
  - We update the `user_progress` table: increment attempts, and increment correct count if the answer was correct. If an entry for this user & section doesn’t exist yet (first attempt on that topic), we insert a new row.
  - We return a JSON indicating if the answer was correct and a message. The message for text is a simple "Correct!" or "Incorrect..." prompt. For code, it tells whether tests passed or failed (mock).
- In **`/user_progress`**:
  - We perform a LEFT JOIN between sections and user_progress to get all topics along with attempt/correct counts (if any) for the user. This lets us include sections the user hasn’t tried (they will show up with NULL which we coalesce to 0 attempts).
  - We also compute a simple mastery status with a CASE expression in SQL:
    - Not Attempted (no record in user_progress),
    - Struggling (attempts > 0 but correct = 0),
    - Mastered (correct count >= total questions for that section, meaning they answered all possible questions correctly at least once),
    - In Progress (default for everything else, i.e., some correct but not all).
  - We format the output as a list of topics with attempts, correct, an accuracy percentage, and the mastery status. This is returned as JSON.

All database operations are done using plain SQLite queries. Each endpoint opens a connection, performs queries, and closes it. This is fine for a low-volume usage and simplifies thread-safety (each request uses its own connection). The code includes comments at each major step to aid understanding and to ease maintenance or extension in the future.

**Extensibility:** The code is structured so that components can be easily replaced or extended:
- To integrate a real LLM for question generation, one could replace the `generate_questions_for_section` logic to call an AI service and get questions/answers from it.
- The answer evaluation for text could be improved by using NLP techniques or by calling an LLM to rate the answer. For coding questions, one could integrate a sandbox execution (e.g., using `exec()` carefully or an external judge system like Judge0) to run actual test cases.
- The adaptivity logic is in one place (`next_question`); if a more sophisticated algorithm or more data (like question difficulty ratings, or using user ability estimation) is desired, it can be changed without affecting the external API.
- We already separated content (sections) from questions, so we could add more question types (multiple-choice, etc.) by extending how questions are generated and evaluated. The API could be extended to indicate options for multiple-choice questions, for example.
- The front-end integration is straightforward since all endpoints use standard HTTP+JSON. No special WebSocket or session management is needed here (though one could add authentication for multiple users in a real system).

Now that the backend is implemented, we can set it up and test it locally.

## Local Setup and Testing Guide

Follow these steps to set up the application and test it with sample inputs:

1. **Install Dependencies:** Make sure you have **Python 3.9+** installed. Install the required packages using pip. The main dependencies are:
   - FastAPI (for the API framework) – `pip install fastapi`
   - Uvicorn (for running the server) – `pip install uvicorn[standard]` (the standard extra installs uvicorn with its recommended dependencies).
   - PyMuPDF (for PDF parsing) – `pip install PyMuPDF`. This allows the app to read PDF contents. (Alternatively, you could use PyPDF2 with minor code changes if preferred.)
   - `python-multipart` – `pip install python-multipart` (this is needed by FastAPI to handle file uploads via form data) ([Request Files - FastAPI](https://fastapi.tiangolo.com/tutorial/request-files/#:~:text=Request%20Files%20,then%20install%20it%2C%20for%20example)).
   - (Optional) If you plan to parse PDFs with images, having Pillow installed might be useful, but PyMuPDF can extract images without explicitly using Pillow.
   - SQLite is built-in with Python, so no extra install needed for the database.
   - You can also install `uvicorn[standard]` which covers uvicorn and some performance improvements for FastAPI.
   - For convenience, you can install all at once: `pip install fastapi uvicorn[standard] PyMuPDF python-multipart`.

2. **Environment Setup:** No special environment configuration is required beyond installing packages. However, it's good practice to do this in a virtual environment:
   - Create a venv: `python -m venv venv` and activate it (`source venv/bin/activate` on Linux/Mac, or `.\venv\Scripts\activate` on Windows).
   - Install the packages inside the venv.
   - Ensure you have a directory where you’ll run the script and where the SQLite database file (`evaluation.db`) will be created. The code will also create an `images/` directory in the current working directory if the PDF has images.
   - Place the Python script (the FastAPI app code) in a file, e.g. `main.py`.

3. **Running the Server Locally:** Start the FastAPI server using Uvicorn:
   - Execute: `uvicorn main:app --reload`
   - Here `main` is the Python filename (without `.py`) and `app` is the FastAPI instance name in the code. The `--reload` flag is useful during development as it auto-reloads on code changes.
   - You should see Uvicorn starting up, and it will bind to `http://127.0.0.1:8000` by default. You can open a browser and navigate to `http://127.0.0.1:8000/docs` to see the interactive Swagger UI automatically provided by FastAPI. All endpoints (`/upload_pdf`, `/next_question`, etc.) will be listed there, and you can even test them from that interface.
   - The first run will create an `evaluation.db` SQLite file in the same directory (after you upload a PDF) and possibly an `images/` folder if images were extracted.

4. **Testing the API Endpoints:** You can test the endpoints using **curl** commands or via **Postman** (or the Swagger UI).
   - **Upload a PDF:** Have a PDF file ready (e.g., `sample.pdf`). For example, create a small PDF with a couple of sections to test. Using curl, you can upload it:
     ```bash
     curl -X POST "http://localhost:8000/upload_pdf" -F "pdf_file=@/path/to/sample.pdf"
     ```
     Make sure to replace `/path/to/sample.pdf` with your PDF’s path. The `-F` flag sends a multipart form request. You should get a JSON response with `"sections_added"` and `"questions_added"`. For example: `{"sections_added": 3, "questions_added": 5}` meaning it parsed 2 sections from the PDF plus 1 coding challenge added, and generated questions accordingly.
   - **Get the first question:** Now request a question for a user. You can use a simple user_id like "user1" (it can be any string or number, as we did not enforce a specific format).
     ```bash
     curl "http://localhost:8000/next_question?user_id=user1"
     ```
     This will return a JSON with a question. For example:
     ```json
     {
       "question_id": 1,
       "question_text": "What are the key points covered in the \"Introduction to Algebra\" section?",
       "type": "text"
     }
     ```
     The exact text depends on your PDF content. If the PDF had an introduction section, it might ask about it. The `question_id` is important, as we will use it when submitting the answer.
   - **Submit an answer:** Suppose the question asked was *"What are the key points covered in the \"Introduction to Algebra\" section?"* and from reading the textbook you know the answer (or you want to test the correctness logic). Use the question_id from the previous response and provide an answer:
     ```bash
     curl -X POST "http://localhost:8000/submit_answer" \
          -H "Content-Type: application/json" \
          -d '{"user_id": "user1", "question_id": 1, "answer": "It introduces basic algebra concepts like variables and equations."}'
     ```
     This sends a JSON body with the user’s answer. The response will be something like:
     ```json
     { "correct": true, "message": "Correct!" }
     ```
     If the answer was deemed sufficient by our keyword check (the example answer contains "variables" and "equations" which might have been keywords in the expected answer), it returns correct. If you send a very wrong or irrelevant answer, it would likely return `{"correct": false, "message": "Incorrect. Please review the section and try again."}`.
   - **Get next question:** After submitting, you can call `/next_question` again:
     ```bash
     curl "http://localhost:8000/next_question?user_id=user1"
     ```
     Now, the system will pick either another section (if one is unattempted) or, if all were attempted, the weakest section. In our example, if "user1" got the first question right, the engine will move to another topic (since the first topic is no longer the weakest). You’ll get a new question (perhaps from section 2 of the PDF). If the first answer was wrong, the weakest topic is still that first section – but our logic will likely still introduce a new section if any unattempted remain (to ensure coverage). After all sections are introduced, if some are still incorrect, then it would circle back.
   - **Submit another answer:** You can continue this cycle for a few questions, answering some correctly or incorrectly to simulate the adaptive behavior.
   - **Check user progress:** At any point, you can retrieve the progress:
     ```bash
     curl "http://localhost:8000/user_progress?user_id=user1"
     ```
     The output might look like:
     ```json
     {
       "user_id": "user1",
       "topics": [
         {"topic": "Introduction to Algebra", "attempts": 1, "correct": 1, "accuracy": "100%", "mastery": "Mastered"},
         {"topic": "Advanced Algebra", "attempts": 1, "correct": 0, "accuracy": "0%", "mastery": "Struggling"},
         {"topic": "Coding Challenge: Add Two Numbers", "attempts": 0, "correct": 0, "accuracy": "N/A", "mastery": "Not Attempted"}
       ]
     }
     ```
     This is just an example. It shows that for "Introduction to Algebra" the user answered 1 out of 1 questions correctly (mastered the basic question; if there was a harder question it’s still unattempted but since one question covers that topic’s easy part, we marked Mastered for simplicity). For "Advanced Algebra", the user attempted one and got it wrong, so accuracy 0% and status "Struggling". The coding challenge hasn't been served yet (0 attempts).
     The exact structure and values will depend on your PDF content and the answers you gave. This output confirms that the adaptivity logic is tracking each topic.

You can repeat the above with different user_ids to simulate different users (each user’s progress is tracked separately by the `user_id` you provide).

Use Postman or the interactive docs if you prefer a GUI:
- In Postman, create a new request for each endpoint. For file upload, select "form-data" and add a file field.
- For GET requests, you can just provide params in the URL or use Postman's parameter UI.
- For POST `/submit_answer`, set the body to raw JSON.

**Note:** The dummy evaluation may mark some answers correct even if they are not perfect, due to the simple keyword matching. This is intentional to simulate an automated grader and can be adjusted.

Finally, this setup is suitable for local testing and demonstration purposes. In a production scenario, you would add proper error handling (e.g., what if the PDF is scanned/OCR needed, or if no sections found), authentication (so that not anyone can call the endpoints or to tie user_id to real user accounts), and potentially deploy it with a production server (Gunicorn/Uvicorn workers) and connect to a more robust database if needed. Nonetheless, the core functionality as requested – PDF ingestion, mock question generation, adaptive question selection, and answer evaluation – is implemented and can be tested with the above steps. Enjoy building and testing your adaptive quiz module!
