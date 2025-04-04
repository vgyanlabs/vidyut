# Scalable Backend Architecture for Adaptive Quiz Platform

## Overview and Key Components  
This design uses a **microservices-style backend** with clear separation of concerns, ensuring scalability and efficient resource use. The core flow involves:  

1. **User Authentication (Google SSO):** Users log in via the university’s Google SSO, delegating identity management to Google. The backend receives an OAuth token and verifies user info (no passwords stored locally). On first login, a user profile is created in the database.  
2. **Quiz Initialization & Question Generation:** When a user starts a quiz for a topic, the system **dynamically generates a set of questions** for that topic using an LLM-based question generator. These questions (including answers and metadata) are prepared at session start and stored in MongoDB. This avoids long waits between questions and tailors content to the user’s chosen topic.  
3. **Adaptive Quiz Session State:** As the quiz progresses, an **adaptive engine** tracks the user’s performance in real-time using Redis. Recent answers are kept in a sliding “performance window” to adjust difficulty on the fly (e.g. if a user is doing well, the next question may be harder). Redis’s in-memory speed is ideal for this live session state, acting as a fast session store rather than a persistent record ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)). The persistent data (users, questions, results) resides in MongoDB, which serves as the system of record.  
4. **Answer Submission & Evaluation:** For each question answered, the backend evaluates the response. Multiple-choice or text answers are checked against the correct solution in MongoDB; **coding questions** are evaluated via a **static code analysis** service (ensuring no untrusted code execution). Static analysis inspects the code structure without running it ([[Static vs. dynamic code analysis: A comprehensive guide](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)), providing a secure way to check correctness (e.g. by analyzing the AST or specific solution patterns). The result (correct/incorrect) is recorded. The adaptive logic then uses the Redis session data (recent correctness, difficulty level) to select the next question from the pre-generated pool at an appropriate difficulty.  
5. **Analytics & ML Feedback Loop:** All user interactions and outcomes are **logged in detail**. These analytics are stored in MongoDB (and/or emitted to a logging pipeline) to be processed nightly. A batch job or ML pipeline aggregates this data to **fine-tune the LLM** question generation prompts or models and improve the adaptive algorithms. This feedback loop uses the collected data (question difficulty vs. success rates, common wrong answers, etc.) to continuously improve content and adaptation for future sessions.

Below, we detail each aspect of the design: data models, storage partitioning, API endpoints, logging, and the scalability/reliability considerations for a production-grade system.

## Data Models and Schema Definitions

### MongoDB Collections (Persistent Data)  
MongoDB stores all **core persistent data**: users, content, questions, and results. The schema can be defined in pseudocode as follows (using a JSON-like structure for clarity):

- **Users Collection:** User profiles and enrollment info. Each document might look like:  
  ```js
  Users {
    _id: ObjectId,            // Unique user ID
    googleId: String,        // Google SSO subject or email for identification
    name: String,            // User full name
    email: String,           // Email (from SSO, likely the Google account email)
    enrolledCourses: [ {...} ], // (Optional) courses or topics the user has access to
    // Additional profile info as needed (roles, etc.)
    progress: {              // (Optional) quick summary of progress
       topicsCompleted: [topicId...],
       // Could also store aggregated scores per topic for fast access
    }
  }
  ```  

- **Topics Collection:** Information about quiz topics (e.g. subjects or chapters). For example:  
  ```js
  Topics {
    _id: ObjectId,  
    title: String,           // Topic name (e.g. "Linear Algebra - Matrices")
    description: String,     // Description or syllabus of the topic
    contentRef: String,      // Reference to study material (could be a URL or document ID)
    difficultyRange: {min: Number, max: Number}  // Range of difficulty levels available
    // ...other metadata (course, instructor, etc.)
  }
  ```  

- **Questions Collection:** Stores **quiz questions**. Questions are generated per user & topic at quiz start. We can either embed these in a session document or keep a separate collection. A separate collection allows analysis across questions. Each question document contains the question text and answer info:  
  ```js
  Questions {
    _id: ObjectId,
    topicId: ObjectId,       // Reference to the Topic
    sessionId: ObjectId,     // Reference to the QuizSession (each question tied to a specific user session)
    userId: ObjectId,        // User for whom this question was generated
    text: String,            // The question text (could be multi-line, problem statement)
    options: [String],       // For MCQ: list of options (empty or null for open-ended/coding questions)
    correctAnswer: String,   // The correct answer (or expected answer format)
    difficulty: Number,      // Difficulty level tag (e.g. 1-5 or similar)
    type: String,            // Question type (e.g. "multiple-choice", "coding", "text")
    solutionPattern: String, // (For coding) Pattern or key features expected in code (for static analysis)
    generatedAt: Date        // Timestamp when generated
    // ... possibly additional fields like explanation, etc.
  }
  ```  
  *Rationale:* Storing questions in Mongo allows us to persist the exact questions delivered to each user. This is useful for auditing and analyzing which questions were effective. It also means if a user resumes a quiz, we show the same remaining questions without regenerating. Each question is tied to a session and user, since questions are user-specific in an adaptive scenario.

- **QuizSessions Collection:** (Optional) A high-level record of a quiz attempt by a user on a topic. This can help quickly retrieve progress or finalize results. For example:  
  ```js
  QuizSessions {
    _id: ObjectId,
    userId: ObjectId,
    topicId: ObjectId,
    questions: [ObjectId],   // Array of question IDs generated for this session (in initial order or pool)
    currentIndex: Number,    // Index of the next question to be answered (or number answered so far)
    correctCount: Number,    // Count of correct answers so far
    startTime: Date,
    endTime: Date,
    status: String           // "active", "completed", "abandoned"
  }
  ```  
  *Note:* The session document is convenient for tracking overall quiz state in MongoDB. However, during the live session, Redis will be the source of truth for `currentIndex` and recent performance (for speed), with periodic sync to this collection. At quiz completion, this document is finalized with `endTime`, final scores, etc. If a session doc is not used, the same info can be derived by querying Questions/Attempts by user+topic.

- **Attempts (Responses) Collection:** Each answer submission by a user is logged here as an immutable record. This is crucial for analytics and ML feedback. A document might be:  
  ```js
  Attempts {
    _id: ObjectId,
    userId: ObjectId,
    sessionId: ObjectId,
    questionId: ObjectId,
    topicId: ObjectId,
    answer: String,         // User's answer (text, chosen option, or code submission)
    isCorrect: Boolean,
    timestamp: Date,
    latencyMs: Number       // (Optional) time user took to answer, for difficulty analysis
  }
  ```  
  This **fine-grained logging** of each question attempt is recommended for robust analytics. In a similar scenario, experts advise storing each guess/attempt as a separate document for flexibility in computing stats later ([[nosql - What is the recommended MongoDB schema for this quiz-engine scenario? - Software Engineering Stack Exchange](https://softwareengineering.stackexchange.com/questions/167109/what-is-the-recommended-mongodb-schema-for-this-quiz-engine-scenario#:~:text=I%20would%20store%20each%20guess,document%20would%20be%20as%20follows)](https://softwareengineering.stackexchange.com/questions/167109/what-is-the-recommended-mongodb-schema-for-this-quiz-engine-scenario#:~:text=I%20would%20store%20each%20guess,document%20would%20be%20as%20follows)). This allows easy aggregation of user accuracy, difficulty success rates, etc., without bloating the user or question documents.  

*(Additional collections like an **Analytics** or **Aggregates** collection could exist to store precomputed daily stats or ML outputs. For instance, after nightly processing, we might store updated difficulty parameters or prompt improvements. These are optional and tailored to how the ML pipeline consumes data.)*

### Redis Data Structures (Adaptive Session State)  
Redis is used for **transient, real-time data** that requires ultra-fast reads/writes during a quiz session. We partition the Redis keys by quiz session or user. Key schema examples:

- **Session State Hash:** For each active quiz session, a Redis hash or set of keys tracks the session’s live state. For example:  
  ```
  session:<sessionId> = {
    userId: <userId>,
    topicId: <topicId>,
    currentQuestion: <questionIndex>,   // or questionId of the current question
    currentDifficulty: <level>,         // difficulty level currently targeting
    correctStreak: <count>,             // number of correct answers in a row (for adaptation)
    totalAnswered: <count>
  }
  ```  
  This hash allows quick updates to the current question index and performance counters without a round-trip to MongoDB. The `sessionId` could be the ID of the QuizSession or a UUID generated at start.  

- **Performance Window:** To implement adaptive difficulty, we maintain a **sliding window of recent performance**. For instance, `session:<sessionId>:recentAnswers` could be a Redis list of booleans or scores (1 for correct, 0 for incorrect) representing the last N answers. After each question, we push the new result and trim the list to the last N elements. This provides a quick way to calculate recent accuracy. Alternatively, a running average and count can be kept in the session hash (e.g., `recentCorrectRate`). The window size (e.g., last 5 or 10 questions) smooths fluctuations and avoids abrupt difficulty swings.

- **Question Queue/Pool:** We also need to know which questions remain and possibly their difficulty. We can keep the list of remaining question IDs in Redis for fast access. For example, `session:<sessionId>:questions = [q1, q2, ..., qN]` (initially all generated questions). We then pop from this list as questions are delivered. If we want adaptive selection rather than a fixed order, we might store multiple sorted sub-lists by difficulty:
  - e.g., `session:<sessionId>:easy`, `session:<sessionId>:medium`, `session:<sessionId>:hard` containing IDs of questions tagged with those difficulties. The adaptive logic can choose from the appropriate list (pop from hard list if the user is doing well, etc.). A Redis **sorted set** keyed by difficulty is another approach: store all question IDs in a sorted set scored by difficulty, and use ZRANGE/ZPOPMIN/ZPOPMAX to pick an easier or harder question dynamically. This would allow selecting the next question by difficulty threshold.  

- **TTL and Cleanup:** Keys can have a TTL (expiration) set to auto-clean sessions that are inactive or completed (e.g. expire a session’s keys a day after completion to free memory). For example, when a session ends, we set an expiration on `session:<sessionId>*` keys or explicitly delete them after transferring needed data to MongoDB.

These Redis structures ensure that during a quiz, retrieving the next question or updating performance counters is **O(1)** and does not add load to the database. Redis essentially acts as a **shared memory for the distributed app servers**, holding session state that multiple stateless API servers can access. This is a common use-case for Redis (caching or session management) alongside a persistent DB ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)).

## Partitioning of Data: MongoDB vs. Redis  
We partition data storage responsibilities to leverage the strengths of each system:

- **MongoDB (Persistent Database):** MongoDB holds all data that must be **durable, queryable, and relational**. This includes user profiles, the bank of generated questions, and the log of attempts/answers. MongoDB’s document model is flexible for storing varied question types and rich analytics data. It also supports secondary indexes and complex queries (e.g., find all difficult questions where many users answered incorrectly) which is vital for analytics. As a system of record, it ensures data persists across restarts. We also use it to reconstruct state if needed. For example, if a Redis cache were lost or a user resumes after a break, the backend can query MongoDB for which questions were already answered and the next question to continue the session. In summary, **all definitive information lives in MongoDB** for reliability.

- **Redis (In-Memory Store):** Redis is used as a **fast, ephemeral layer** for real-time session data and caching. Its role is to speed up the adaptive engine and user experience:
  - *Session state:* Tracking current question index, recent performance, etc., which are frequently updated each time a user answers. Redis can update these in microseconds, supporting high throughput of quiz interactions.
  - *Adaptive logic:* The calculations to choose the next question (based on recent correctness) need quick reads of recent results – ideal for Redis. By keeping a rolling window of results in memory, we avoid repeated DB reads/writes for each question served.
  - *Transient data:* Data that is relevant only during an ongoing session (or short term) is kept in Redis. If Redis is flushed or crashes, losing this data is not catastrophic – it can be recomputed or the session can be restarted. In other words, we **do not rely on Redis for permanent storage** ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)). This aligns with best practices: *“Redis can be used as a cache or session store together with a persistent database such as MongoDB”* ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)). We never store critical records only in Redis; anything important is eventually written to Mongo.

**Justification:** This partitioning maximizes both performance and data safety. MongoDB handles complex queries and durability, while Redis ensures the system is responsive and can handle many concurrent users adjusting their quiz in real-time. By using Redis for session/cache and Mongo for persistence, we follow a common pattern where Redis is **not** used as the sole source of truth (avoiding in-memory data loss issues) ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)). Instead, Redis speeds up the system and MongoDB provides the reliable backbone.

## API Endpoint Definitions and Logic  
We define a set of RESTful API endpoints to power the platform. Each endpoint’s request/response schema and internal logic (in pseudocode) is described below. All endpoints (except the generation and analytics admin endpoints) require the user to be authenticated via Google SSO (e.g., a JWT or session token from the SSO flow). 

### 1. **Start Quiz Topic**  
**Endpoint:** `POST /api/quiz/start`  
**Description:** Initiate a new adaptive quiz session for a given topic. This will trigger question generation for the topic and return the first question to the client.  

- **Request:** JSON body with the topic identifier. For example:  
  ```json
  { "topicId": "<topic_id>" }
  ```  
  (The server infers the user from the auth token and links this session to that user.)

- **Response:** JSON containing a new session identifier and the first quiz question. For example:  
  ```json
  {
    "sessionId": "<session_id>",
    "question": {
       "id": "<question_id>",
       "text": "First question text...",
       "options": ["A", "B", "C", "D"],   // if multiple-choice
       "type": "multiple-choice"
    }
  }
  ```  
  The client would display `question.text` (and options if present) to the user. For a coding question, the `options` field might be null and type would be "coding", indicating the user needs to submit code for answer.

- **Internal Business Logic (Pseudocode):**  

  ```pseudo
  function startQuiz(userId, topicId):
      # 1. Validate user and topic
      user = db.Users.findOne({_id: userId})
      topic = db.Topics.findOne({_id: topicId})
      if not user or not topic:
          return Error(404, "User or topic not found")
      
      # 2. Initialize a new quiz session
      session = {
         userId: userId,
         topicId: topicId,
         startTime: now(),
         status: "active"
      }
      sessionId = db.QuizSessions.insert(session)  # create a session record in Mongo (get an ID)
      
      # 3. Generate questions for this topic (using LLM or predefined logic)
      questions = QuestionGenerator.generate(topic)  
         # generate returns a list of question objects (text, options, correctAnswer, difficulty, etc.)
         # Under the hood, this may call an LLM with a prompt to create, say, 10 questions of mixed difficulty.
      
      # 4. Store generated questions in DB, linked to this session
      for q in questions:
         q.topicId = topicId
         q.userId = userId
         q.sessionId = sessionId
      db.Questions.insertMany(questions)
      
      # 5. Prepare Redis session state for adaptivity
      redisKey = "session:" + sessionId
      REDIS.HMSET(redisKey, {
         "userId": userId,
         "topicId": topicId,
         "currentQuestion": 0,
         "currentDifficulty": questions[0].difficulty,  # start with difficulty of first Q
         "correctStreak": 0,
         "totalAnswered": 0
      })
      # Also store question ordering or pool in Redis if needed
      REDIS.RPUSH(redisKey + ":questions", [q.id for q in questions]) 
         # (Optional: if we plan to pop questions from this list in order or by adaptive logic)
      # Initialize performance window list
      REDIS.DEL(redisKey + ":recentAnswers")  # ensure no old data
      # (No answers yet, we will push as user answers)
      
      # 6. Return sessionId and first question to caller
      firstQ = questions[0]
      return {
         sessionId: sessionId,
         question: {
            id: firstQ._id,
            text: firstQ.text,
            options: firstQ.options,
            type: firstQ.type
         }
      }
  ```
  *Notes:*  
  - **Question Generation:** `QuestionGenerator.generate(topic)` abstracts the LLM-based generation. This might involve prompting a language model with the topic’s content or description to produce a set of questions and answers. We ensure the prompt is crafted to return structured output (e.g., JSON) so it can be parsed directly ([[Build a Quiz Generator with GenAI and Cloud Run  |  Google Codelabs](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)). For example, the prompt might say: *“Generate 10 quiz questions (with difficulty labeled easy/medium/hard) on the topic of X, provide four multiple-choice options and identify the correct answer.”* The model’s JSON output is parsed into the `questions` list. Having the LLM output in JSON means minimal post-processing and direct insertion into MongoDB ([[Build a Quiz Generator with GenAI and Cloud Run  |  Google Codelabs](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)).  
  - **Difficulty Variety:** We can instruct the generator to include a range of difficulties. For instance, 3 easy, 4 medium, 3 hard questions. This gives the adaptive engine headroom to go easier or harder based on performance. The `difficulty` field in each question is set accordingly (1, 2, 3 or tags "easy"/"hard").  
  - **Storing Questions:** Each question is stored in the Questions collection tied to this session (and user). This not only persists them for the session’s duration (in case the user disconnects and returns) but also allows reusing them for analysis (since questions generated by LLM can be evaluated later for quality – e.g., if a generated question turned out to be too difficult for everyone, the ML pipeline might catch that).  
  - **Redis State Init:** We set `currentQuestion = 0` (index in the list) meaning the first question. Alternatively, we could store the actual question ID being served, but using an index that maps into the stored list of question IDs is straightforward. The `currentDifficulty` is set for reference (though not strictly needed if we derive from the question itself). The question list in Redis (`:questions`) might not be necessary if we always query MongoDB for the next question by index. However, caching it in Redis can eliminate a DB call when moving to the next question. We choose to push all question IDs into a Redis list for quick popping or index-based access.  

### 2. **Submit Answer**  
**Endpoint:** `POST /api/quiz/answer` (Alternatively, this could be `/api/quiz/{sessionId}/answer` to explicitly tie to session)  
**Description:** Submit an answer for the current question in an ongoing quiz session. The server evaluates the answer, updates the adaptive state, and returns whether it was correct along with the next question (if any).  

- **Request:** JSON containing the session identifier, the question identifier, and the answer data. For example:  
  ```json
  {
    "sessionId": "<session_id>",
    "questionId": "<question_id>",
    "answer": "...user answer..."
  }
  ```  
  The `answer` field format depends on question type: for MCQ it might be an option ID or letter, for text a string, for code a string of code.

- **Response:** JSON indicating the result and the next question (if the quiz is not yet finished). Example for a non-final question:  
  ```json
  {
    "correct": true,
    "nextQuestion": {
       "id": "<question_id_2>",
       "text": "Next question text...",
       "options": ["..."],
       "type": "coding"
    }
  }
  ```  
  If that was the last question in the quiz, the response might omit `nextQuestion` and instead include a completion message or summary:  
  ```json
  {
    "correct": false,
    "completed": true,
    "score": 7,
    "total": 10
  }
  ```  
  (meaning the user got 7/10 correct, for instance).

- **Internal Business Logic (Pseudocode):**  

  ```pseudo
  function submitAnswer(userId, sessionId, questionId, answer):
      # 1. Validate session and question
      sessionKey = "session:" + sessionId
      sessionState = REDIS.HGETALL(sessionKey)
      if not sessionState or sessionState["userId"] != userId:
          return Error(401, "Invalid session or not authorized")
      currIndex = int(sessionState["currentQuestion"])
      # Ensure the questionId matches the expected current question to prevent skipping
      expectedQId = REDIS.LINDEX(sessionKey + ":questions", currIndex)
      if questionId != expectedQId:
          return Error(400, "Question out of order")
      
      # 2. Fetch question details from DB (needed to evaluate answer)
      question = db.Questions.findOne({_id: questionId})
      if not question:
          return Error(400, "Question not found")
      
      # 3. Evaluate the answer based on question type
      correct = false
      if question.type == "multiple-choice" or question.type == "text":
          # For MCQ or text-based: direct comparison (case-insensitive for text maybe)
          if answer == question.correctAnswer:
              correct = true
      elif question.type == "coding":
          # For coding: use static analysis service
          correct = StaticCodeAnalyzer.check(answer, question.solutionPattern)
          # StaticCodeAnalyzer.check would parse the 'answer' code and compare against expected logic
          # (e.g., ensure certain function names, no forbidden methods, output of sample tests, etc.)
      else:
          # Other types (if any) can be handled here
          correct = evaluateCustom(question, answer)
      
      # 4. Log the attempt in MongoDB (for analytics)
      attemptLog = {
          userId: userId, sessionId: sessionId, topicId: question.topicId,
          questionId: questionId, answer: answer, isCorrect: correct, timestamp: now()
      }
      db.Attempts.insert(attemptLog)
      
      # 5. Update MongoDB session document (increment counts) - optional for real-time
      db.QuizSessions.update(
         {_id: sessionId},
         { $inc: { totalAnswered: 1, correctCount: (correct ? 1 : 0) } }
      )
      # (This is optional real-time. Alternatively, update at end of quiz. We do it now for intermediate progress tracking.)
      
      # 6. Update Redis adaptive state
      # 6a. Update performance window
      REDIS.RPUSH(sessionKey + ":recentAnswers", (correct ? 1 : 0))
      windowSize = 5
      REDIS.LTRIM(sessionKey + ":recentAnswers", -windowSize, -1)  # keep last 5 results
      
      # 6b. Update streak and total
      if correct:
          newStreak = int(sessionState["correctStreak"]) + 1
      else:
          newStreak = 0  # reset streak on any wrong
      REDIS.HMSET(sessionKey, {
          "correctStreak": newStreak,
          "totalAnswered": int(sessionState["totalAnswered"]) + 1
      })
      
      # 6c. Determine next question difficulty using performance window
      recentAnswers = REDIS.LRANGE(sessionKey + ":recentAnswers", 0, -1)  # list of 0/1
      recentAccuracy = avg(recentAnswers)  # e.g., 0.8 if 4/5 correct
      currentDiff = question.difficulty
      nextDiff = currentDiff  # default same
      if recentAccuracy > 0.8 and currentDiff < maxDifficulty:
          nextDiff = currentDiff + 1    # doing well -> go harder
      elif recentAccuracy < 0.5 and currentDiff > minDifficulty:
          nextDiff = currentDiff - 1    # struggling -> go easier
      # (We can also incorporate streak: e.g., if correctStreak is high, definitely increase diff, etc.)
      
      # 6d. Select the next question from the remaining pool
      nextQuestionId = null
      remainingQKey = sessionKey + ":questions"
      # We will scan remaining questions for one with difficulty == nextDiff
      remainingQs = REDIS.LRANGE(remainingQKey, currIndex+1, -1)
      # (Assuming questions were initially sorted by difficulty or random. For a smarter pick, 
      # we could have separate lists or use sorted set as discussed.)
      for qid in remainingQs:
          qDoc = db.Questions.findOne({_id: qid}, {difficulty: 1})
          if qDoc and qDoc.difficulty == nextDiff:
              nextQuestionId = qid
              # Swap this question to be right after current index in the list
              REDIS.LREM(remainingQKey, 1, qid)
              REDIS.LINSERT(remainingQKey, 'AFTER', expectedQId, qid)
              break
      if not nextQuestionId:
          # If no question of the target difficulty found, just take the next in list (or closest difficulty).
          nextQuestionId = REDIS.LINDEX(remainingQKey, currIndex+1)
      
      # 6e. Increment currentQuestion index
      REDIS.HINCRBY(sessionKey, "currentQuestion", 1)
      
      # 7. Prepare response
      response = { "correct": correct }
      if nextQuestionId:
          nextQ = db.Questions.findOne({_id: nextQuestionId})
          response["nextQuestion"] = {
              "id": nextQ._id,
              "text": nextQ.text,
              "options": nextQ.options,
              "type": nextQ.type
          }
      else:
          # No more questions => quiz completed
          response["correct"] = correct
          response["completed"] = true
          # Compute final score from session or attempts
          totalQs = int(sessionState["totalQuestions"]) if stored, else len(remainingQs)+currIndex+1
          corrCount = int(sessionState["correctStreak"]) if correct (just an approximation)
          # (Better: we could have stored correctCount in Redis or compute from attempts)
          response["score"] = db.QuizSessions.findOne({_id: sessionId}).correctCount + (correct ? 1:0)
          response["total"] = totalQs
          # Mark session finished in DB
          db.QuizSessions.update({_id: sessionId}, { $set: { status: "completed", endTime: now() } })
          # Optionally remove Redis keys or set expiration
          REDIS.EXPIRE(sessionKey, 3600)  # keep data for an hour, then auto-remove
      return response
  ```
  *Notes:*  
  - **Answer Evaluation:** For non-coding questions, evaluation is straightforward by matching the answer to the stored correct answer (exact match or perhaps case-insensitive or allowing multiple correct phrasing if needed). For coding questions, we call `StaticCodeAnalyzer.check(submittedCode, solutionPattern)`. This function (or service) would implement static analysis rules to determine correctness. For example, it might parse the AST of the submitted code and check for the presence of required functions or logic, or run the code through test cases in a sandbox without executing arbitrary user code. The key is no direct execution of untrusted code; instead, rely on static checks (like pattern matching outputs for given inputs, checking complexity, etc.) ([[Static vs. dynamic code analysis: A comprehensive guide](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)). This approach avoids security risks of code execution and still provides an automated way to judge answers. (In a production system, one might integrate a service like a code runner in a secure container if needed, but here we explicitly avoid execution.)  
  - **Logging Attempts:** Each attempt is inserted into the `Attempts` collection immediately. This creates a robust audit trail and dataset for analytics. Storing every attempt as its own document is scalable and allows flexible analysis (e.g. computing user accuracy via aggregation) ([[nosql - What is the recommended MongoDB schema for this quiz-engine scenario? - Software Engineering Stack Exchange](https://softwareengineering.stackexchange.com/questions/167109/what-is-the-recommended-mongodb-schema-for-this-quiz-engine-scenario#:~:text=I%20would%20store%20each%20guess,document%20would%20be%20as%20follows)](https://softwareengineering.stackexchange.com/questions/167109/what-is-the-recommended-mongodb-schema-for-this-quiz-engine-scenario#:~:text=I%20would%20store%20each%20guess,document%20would%20be%20as%20follows)). We include all relevant info: which question, what the answer was, and whether it was correct. (Optionally, we might exclude the actual code text in logs for storage reasons and just store a reference if needed, but including it can help in ML analysis to see common wrong answers or code mistakes.)  
  - **Adaptive Logic:** The logic in step 6 adjusts difficulty. We used a simple heuristic: if recent accuracy is high, increase difficulty; if low, decrease it. We consider a recent window (last 5 answers) which is fetched from Redis. More sophisticated algorithms (Item Response Theory, Bayesian knowledge tracing, etc.) could be used, but a rolling window average is a straightforward approach to adapt in real-time. The `correctStreak` can also be used (e.g., 3 correct in a row might trigger a jump in difficulty). This state is maintained in Redis per session.  
  - **Selecting Next Question:** We attempt to find the next question of the desired difficulty from the pool of remaining questions. In the pseudocode, we fetched the remaining question IDs from Redis and then checked their difficulties in MongoDB one by one. In practice, we could have stored the difficulties in Redis as well (e.g., a parallel list or a sorted set as noted). To optimize, one might generate the questions sorted by difficulty initially, or maintain separate lists. Due to time complexity concerns, scanning many remaining questions isn't ideal; a better approach is to use a sorted set of unused question IDs by difficulty and pick the min/max as needed. The design could be: `session:<id>:questions_by_difficulty` (sorted set where score = difficulty). Then: 
    - If need easier: `ZPOPMIN` to get the lowest difficulty remaining question.  
    - If need harder: `ZPOPMAX` for highest difficulty.  
    - If need medium: pop from middle or maintain 3 sets (easy/med/hard) and choose accordingly.  
  For simplicity, we’ve shown a linear scan, but the system should be designed with efficient selection in mind (the exact method can be refined during implementation).  
  - **Progression and Completion:** We increment the `currentQuestion` index in Redis to move to the next question. When no next question is found (meaning we reached the end of the list), we mark the session complete. We update the session record in MongoDB with status and end time, and compute the final score (which could also be just `correctCount` from that record). The response includes the final score out of total questions so the frontend can display a summary. We also clean up the Redis state by expiring it soon after completion (the data is already in Mongo if needed later).  
  - **Concurrency & Consistency:** Because the state is kept in Redis, multiple answer submissions for the same session should be sequential (the client should not allow two answers at once). We also double-check that the `questionId` in the request matches the expected current question to prevent any race or cheating by skipping. This is a simple guard.  

### 3. **Retrieve User Progress**  
**Endpoint:** `GET /api/user/progress`  
**Description:** Fetch the user’s overall progress and status in various topics/quizzes. This allows showing a dashboard of what the user has completed or their performance so far.  

- **Request:** No body (the user is identified by auth token). Optionally, an admin could specify a user ID (e.g., `/api/user/<id>/progress`) but typically each user fetches their own.

- **Response:** JSON structure with progress details. For example:  
  ```json
  {
    "userId": "<user_id>",
    "topics": [
       {
         "topicId": "<topic1_id>",
         "topicTitle": "Linear Algebra - Matrices",
         "completed": true,
         "score": 8,
         "total": 10,
         "lastAttempt": "2025-03-30T10:00:00Z"
       },
       {
         "topicId": "<topic2_id>",
         "topicTitle": "Calculus - Derivatives",
         "completed": false,
         "currentScore": 5,
         "answered": 5,
         "totalQuestions": 10,
         "status": "in-progress"
       }
    ]
  }
  ```  
  Here the user has completed the Matrices topic quiz (score 8/10) and is halfway through the Derivatives quiz. The response lists each topic of interest with either a completion status or current progress if in progress.

- **Internal Business Logic:**  

  ```pseudo
  function getUserProgress(userId):
      user = db.Users.findOne({_id: userId})
      if not user: return Error(404, "User not found")
      
      topicsProgress = []
      
      # Fetch all sessions of this user, possibly the latest per topic
      sessions = db.QuizSessions.find({userId: userId})
      # Alternatively, if no QuizSessions collection, derive from Attempts:
      # sessions = attempts.aggregate([{$match: {userId}}, {$group: { _id: "$topicId", ...}}])
      
      for sess in sessions:
          topic = db.Topics.findOne({_id: sess.topicId}, {title:1})
          progress = {}
          progress["topicId"] = sess.topicId
          progress["topicTitle"] = topic.title if topic else "Unknown"
          if (sess.status == "completed"):
              progress["completed"] = true
              progress["score"] = sess.correctCount  # total correct in that session
              totalQ = len(sess.questions) if sess.questions else sess.totalQuestions
              progress["total"] = totalQ
              progress["lastAttempt"] = sess.endTime
          else:
              # If there's an active/incomplete session
              progress["completed"] = false
              # We can compute current score from Attempts or session partial data
              answeredCount = sess.currentIndex or sess.totalAnswered
              correctCount = sess.correctCount  (if session doc has it; if not, compute from Attempts)
              progress["currentScore"] = correctCount
              progress["answered"] = answeredCount
              progress["totalQuestions"] = len(sess.questions)
              progress["status"] = "in-progress"
              progress["lastAttempt"] = /* perhaps last attempt time via Attempts collection */
          topicsProgress.append(progress)
      
      return { userId: userId, topics: topicsProgress }
  ```
  *Notes:*  
  - This endpoint compiles a summary of the user’s progress across topics. The data can come from the `QuizSessions` collection where we stored the outcome of each quiz session. If we allow multiple attempts per topic, we might return the latest or best attempt. Here we assume one active or completed session per topic for simplicity.  
  - If a `QuizSessions` collection is maintained with fields like `correctCount` and total questions, we can directly use those. If not, we could compute on the fly from the Attempts logs (e.g., count attempts per topic that belong to the latest session).  
  - We include whether the quiz is completed or still in progress. For an in-progress quiz, the `answered` vs `totalQuestions` gives how far along the user is. This data could be also stored in the session doc in Mongo (updated each answer as we did, or updated when the user exits the quiz). Because we did update `correctCount` and `totalAnswered` in the session doc at each answer, the data is readily available.  
  - The endpoint may also filter to only active courses, etc., but that's outside scope. We simply return an array of topics the user has engaged with.  
  - This allows the front-end to show something like a progress bar for each topic and final scores for completed quizzes.

### 4. **Generate New Question(s) [Internal]**  
**Endpoint:** `POST /api/admin/generateQuestions` (or simply an internal function call, not exposed to end-users)  
**Description:** Trigger the question generation for a given topic, using the LLM/ML pipeline. In our flow, this is called as part of “Start Quiz Topic”, but we document it separately to show how the generation works in isolation. This might also be used by admins to pre-generate or test questions for a topic.  

- **Request:** JSON with details of generation parameters, e.g.:  
  ```json
  { 
    "topicId": "<topic_id>",
    "numQuestions": 10,
    "difficultySpread": {"easy":3, "medium":4, "hard":3}
  }
  ```  
  The parameters can include how many questions and how difficult. If not provided, defaults are used.

- **Response:** JSON array of generated questions (or success status if they are directly saved to DB). For example:  
  ```json
  {
    "questions": [
      {
        "text": "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?",
        "options": ["ad - bc", "a + d - b - c", "ab + cd", "None of the above"],
        "correctAnswer": "ad - bc",
        "difficulty": 1
      },
      { ... 9 more questions ... }
    ]
  }
  ```  
  In production, we might not actually return the questions to the client in a real quiz start (we’d only return the first question), but as an admin or debug endpoint this could be useful.

- **Internal Logic:**  

  ```pseudo
  function generateQuestions(topicId, numQuestions=10, difficultySpread=null):
      topic = db.Topics.findOne({_id: topicId})
      if not topic:
          return Error(404, "Topic not found")
      # Prepare prompt for LLM
      prompt = buildQuizPrompt(topic, numQuestions, difficultySpread)
      # Example: "Generate {numQuestions} questions about {topic.title}. 
      # Provide 4 multiple-choice options and mark the correct answer. Ensure {difficultySpread.easy} easy, {difficultySpread.medium} medium, {difficultySpread.hard} hard questions."
      
      rawOutput = LLMService.generateText(prompt)  # call to external LLM API or internal model
      # Expect rawOutput to be JSON or a format we can parse
      questions = parseQuizJSON(rawOutput)
      
      # Optionally, post-process questions for quality:
      # e.g., verify each has one correct answer, no duplicate questions, etc.
      
      # Save questions to DB (if we want to store them for later use or caching)
      for q in questions:
          q.topicId = topicId
      db.GeneratedQuestions.insertMany(questions)  # (could be a separate collection for generated templates)
      
      return { "questions": questions }
  ```
  *Notes:*  
  - **LLM Prompting:** We build a prompt incorporating the topic information. If the topic has reference material (e.g., a summary or lecture notes), we could feed that into the prompt or use a Retrieval-Augmented Generation (RAG) approach: retrieve key facts from a knowledge base about the topic and give them to the LLM to ensure accuracy. But given the question constraints, we'll assume the LLM has been fine-tuned or is capable of generating questions on that topic with the prompt alone. The prompt includes a requirement for structured output (like JSON with fields for question, options, answer, difficulty).  
  - **Parsing and Validation:** We parse the LLM’s output. We might ask the LLM to directly output JSON. For instance, few-shot examples in the prompt can ensure it responds in a specific JSON schema ([[Build a Quiz Generator with GenAI and Cloud Run  |  Google Codelabs](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)](https://codelabs.developers.google.com/cloud-genai#:~:text=Once%20you%20have%20a%20prompt,be%20using%20later%20in%20this)). After parsing, it’s wise to validate the questions (the platform might run them through a content filter or ensure the difficulty tags match the intended count).  
  - **Storing Generated Questions:** In the actual quiz flow, we store questions tied to a user session. In this admin scenario, we might store them in a `GeneratedQuestions` collection or reuse them in future (though the problem statement says questions are not pre-generated in bulk, so reuse might be low). Still, saving can help in auditing or reusing in case the LLM service is down (fallback to an existing question pool).  
  - **Return Format:** We return the list of questions. In a real quiz start, we wouldn’t expose all questions to the user (to prevent cheating by peeking ahead); we would save them and return only the first. This endpoint is primarily for system use, so returning all is fine here.

### 5. **Fetch Analytics for Feedback Loop**  
**Endpoint:** `GET /api/admin/analytics`  
**Description:** Retrieve collected analytics data or summaries to feed into the ML/LLM fine-tuning pipeline. This is an administrative endpoint intended to be used by the nightly job or by data scientists. It provides either raw interaction data or aggregated metrics for a given time range.  

- **Request:** May include query parameters for date range or type of report. For example:  
  ```
  GET /api/admin/analytics?date=2025-04-04
  ```  
  If no date is given, it might default to “today’s” or the latest data.

- **Response:** Likely a JSON with aggregated stats or a link to download detailed data. For illustration, an aggregated response might look like:  
  ```json
  {
    "date": "2025-04-04",
    "totalQuizzesTaken": 1200,
    "averageScore": 0.85,
    "topics": [
      {
        "topicId": "<id1>",
        "averageScore": 0.92,
        "questionsGenerated": 500,
        "mostChallengingQuestion": "<question_id_123>" 
      },
      {
        "topicId": "<id2>",
        "averageScore": 0.76,
        "questionsGenerated": 480,
        "mostChallengingQuestion": "<question_id_987>"
      }
    ],
    "adaptivePerformance": {
      "easyToHardPromotions": 300,    // number of times difficulty was increased
      "hardToEasyDemotions": 50,
      "stagnant": 850                // sessions without difficulty change
    }
  }
  ```  
  This example shows per-topic performance and some adaptation stats. In addition, the endpoint could allow downloading raw attempt logs (though for large data, direct DB access or a data pipeline might be preferable).

- **Internal Business Logic:**  

  ```pseudo
  function getAnalytics(adminUser, date=None):
      if not adminUser or !adminUser.isAdmin:
          return Error(403, "Forbidden")
      if not date:
          date = today()
      start = date + "T00:00:00Z"
      end = date + "T23:59:59Z"
      
      # Aggregate quiz stats for the day
      stats = {}
      stats["date"] = date
      
      # 1. Total quizzes taken (count distinct sessions completed that day)
      stats["totalQuizzesTaken"] = db.QuizSessions.count({
           status: "completed",
           endTime: { $gte: ISODate(start), $lte: ISODate(end) }
      })
      # 2. Average score of those quizzes
      avgPipeline = [
         { $match: {status:"completed", endTime: {$gte: ISODate(start), $lte: ISODate(end)} } },
         { $group: { _id: null, avgScore: { $avg: { $divide: ["$correctCount", {"$size":"$questions"}] } } } }
      ]
      result = db.QuizSessions.aggregate(avgPipeline).next()
      stats["averageScore"] = result ? result.avgScore : null
      
      # 3. Per-topic analytics
      stats["topics"] = []
      topicAggPipeline = [
         { $match: { endTime: {$gte: ISODate(start), $lte: ISODate(end)} } },
         { $group: { _id: "$topicId",
                     avgScore: { $avg: { $divide: ["$correctCount", {"$size":"$questions"}] } },
                     quizzes: { $sum: 1 }
         } }
      ]
      topicResults = db.QuizSessions.aggregate(topicAggPipeline).toArray()
      for t in topicResults:
         topicInfo = { "topicId": t._id, "averageScore": t.avgScore, "quizzesTaken": t.quizzes }
         # perhaps identify most missed question for each topic:
         hardest = db.Attempts.aggregate([
             { $match: { timestamp: {$gte: ISODate(start), $lte: ISODate(end)}, topicId: t._id } },
             { $group: { _id: "$questionId", correctness: { $avg: { $cond: ["$isCorrect", 1, 0] } } } },
             { $sort: { correctness: 1 } },
             { $limit: 1 }
         ]).next()
         topicInfo["mostChallengingQuestion"] = hardest ? hardest._id : null
         stats["topics"].append(topicInfo)
      }
      
      # 4. Adaptive engine stats (from Redis or attempts)
      # Example: count how often difficulty changed within sessions.
      # We might have logged difficulty changes as special events, or infer from sequence of question difficulties in attempts.
      adaptiveStats = { "easyToHardPromotions": 0, "hardToEasyDemotions": 0 }
      # (Pseudo-counting by scanning attempts diffs)
      userSessions = db.Attempts.aggregate([
         { $match: { timestamp: {$gte: ISODate(start), $lte: ISODate(end)} } },
         { $sort: { timestamp: 1 } },
         { $group: { _id: "$sessionId", difficulties: { $push: "$question.difficulty" } } }
      ])
      for sess in userSessions:
         diffs = sess.difficulties
         for i in range(1, len(diffs)):
             if diffs[i] > diffs[i-1]:
                 adaptiveStats["easyToHardPromotions"] += 1
             elif diffs[i] < diffs[i-1]:
                 adaptiveStats["hardToEasyDemotions"] += 1
      stats["adaptivePerformance"] = adaptiveStats
      
      return stats
  ```
  *Notes:*  
  - This endpoint is flexible. It could either produce **aggregated insights** (like the above) or simply dump raw data (like all Attempt records for the day). Dumping raw logs might be huge, so often an offline process would directly query the database or use a data export. In a production scenario, we might instead have the nightly job run these aggregations internally (using MongoDB’s aggregation pipeline or a Spark job on exported data) and then store the results in an `Analytics` collection or as reports. The endpoint could then just fetch from that. For brevity, we illustrated on-the-fly aggregation.  
  - **Using Attempts vs Sessions:** We primarily used `QuizSessions` for overall quiz stats and `Attempts` for question-level stats. We demonstrated finding the most challenging question by lowest average correctness in attempts. We also sketched how one might measure the adaptive algorithm’s behavior (counting difficulty increases vs decreases between consecutive questions). This requires looking at the sequence of question difficulties a user encountered, which we derived from attempts (assuming we can join each attempt with its question’s difficulty; alternatively, if the Attempts log stored difficulty or if we query the Questions collection for each). This is a form of analytics that can inform if the adaptation logic is perhaps too lenient or aggressive.  
  - **Output to ML Pipeline:** The data from this endpoint (or the underlying collections) would be used to retrain or adjust the LLM and algorithms. For example:
    - The distribution of correctness per question can identify poorly worded questions which can then be used as training examples for the LLM to avoid in the future (or to generate explanations). 
    - If certain topics have low scores, more content or easier questions might be needed – this can feed into prompt adjustments for question generation. 
    - The adaptive performance stats might show that difficulty jumps correlate with lower final scores, suggesting tuning the thresholds.  
  - **Security:** This endpoint should be protected (admin only) since it exposes potentially sensitive aggregated data. In a real system, one might not expose it over public API at all, but rather run the analytics internally. We include it here as it was explicitly requested.

## Logging Strategy for ML Fine-Tuning  
A comprehensive **logging strategy** underpins the nightly ML/LLM fine-tuning process. The goal is to record all relevant interactions and outcomes in a structured way, without impacting the live system performance, and then make that data easily accessible for training/analysis. Key points of the logging strategy:

- **User Interaction Logs:** Every significant event is logged. This includes quiz start (with context like topic and timestamp), each question served, each answer submitted, and quiz completion. As detailed, the `Attempts` collection logs the core of this data – capturing user answers and correctness. We ensure each log entry has identifiers for user, session, topic, and question, enabling rich analysis (filter by topic, difficulty, user cohort, etc.). This fine-grained logging will feed the ML pipeline with plenty of supervision signals.

- **LLM Prompt and Response Logging:** For any LLM-based component, especially question generation, we log the prompts and the generated outputs. For example, when `QuestionGenerator.generate(topic)` calls the LLM, we log the prompt (or a prompt ID if it's templatized) and the returned questions. This is crucial for **prompt tuning** – by linking which prompt version produced which questions and how those questions performed (were they answered correctly by most users or not), we can refine the prompt. Logging the LLM’s raw output and any post-processing applied also helps identify if the model hallucinated incorrect content or if formatting was an issue. These logs might be stored in a separate collection like `GenerationLogs` with fields: {topicId, promptVersion, questionsGenerated: [...], timestamp}. Developers and the ML team can review these to improve prompts or fine-tune the model on cases where generation was suboptimal.

- **System Metrics:** We also enable standard application logging (not just data logs) to monitor system performance. This includes API latency (e.g., how long the LLM took to generate questions, how long static analysis took), error rates (e.g., if any question failed to generate or any evaluation error), and resource usage. While not directly part of the question data, these metrics are important for a production system’s health and can indirectly affect ML (for instance, if generation is too slow, maybe reduce number of questions or use a smaller model).

- **Batch vs Real-Time Logging:** To avoid slowing the user-facing requests, logs can be written **asynchronously**. For instance, when an answer is submitted, the API writes to the `Attempts` collection (which is usually fine as MongoDB inserts are fast), but if throughput is extremely high, we could instead push logs into a message queue (like Kafka or Redis Streams) and have a consumer process that batch inserts them into MongoDB or a data warehouse. This decoupling ensures the quiz flow never waits on a slow disk write. Given our scale (university-level, possibly thousands of users), direct inserts with proper indexing should be okay, but the design is prepared to introduce a message broker if needed.

- **Nightly Pipeline Integration:** At the end of the day, a scheduled job (or an on-demand trigger) will gather the logged data. This could be a script or a workflow in an ML pipeline (e.g., using Apache Airflow or similar). This job will:
  - Query the MongoDB `Attempts` and related collections for new data (e.g., all of today’s attempts).
  - Possibly join with question data to get full context (question text, difficulty, etc.).
  - Produce training data or statistics. For example, it might produce a CSV of `(question_text, was_answered_correctly)` to fine-tune the difficulty prediction model, or use the data to fine-tune the LLM so that it generates slightly easier questions if too many were answered incorrectly.
  - The pipeline might also update some model weights or create new few-shot examples. For instance, it could learn that a certain common wrong answer should be addressed by the question or by adding a hint. Those insights could be turned into new prompt engineering (like adding to the prompt: *"avoid ambiguous wording that led to confusion in question X"*). Because we have stored prompts and user feedback, developers can correlate model outputs with user outcomes ([[LLM Observability: Fundamentals, Practices, and Tools](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)). Such **observability** (recording prompts, responses, and user feedback) is critical for iteratively improving LLM-driven features ([[LLM Observability: Fundamentals, Practices, and Tools](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)).
  - Finally, any updated prompts or model parameters are deployed to the QuestionGenerator or StaticAnalyzer services for the next day’s usage.

- **Analytics Storage:** After processing, we might store high-level summaries (like those returned by the analytics endpoint) in a separate collection or even an analytics database. This provides historical trends and can be used to report progress to instructors or compare difficulty across topics over time.

- **Logging for Debugging:** In addition to ML, logs are invaluable for debugging issues. For example, if a student reports a question as incorrect, we can look up that question in the logs, see the generation prompt and the expected answer, and address the error (perhaps feeding that case into the fine-tuning dataset as a negative example).

In summary, the logging strategy emphasizes **complete data capture and separation from the online user experience**. By capturing user answers and LLM interactions in detail, we create a rich dataset that the nightly pipeline can leverage to continuously improve the adaptive learning experience. This forms a closed feedback loop: the system learns from its own data.  

## Scalability and Reliability Considerations  

Designing for production requires ensuring the system can **scale to many users** and remain **reliable** under heavy load or failures. Below are key considerations for each component:

- **Stateless, Scalable API Servers:** The application servers (running the REST API) are designed to be stateless. All session-specific data is in MongoDB/Redis, so any API instance can handle any user. This means we can run multiple instances behind a load balancer and scale horizontally as the number of concurrent students grows. For example, during midterms many students might use the system simultaneously; we can spawn additional containers/VMs to handle the load. We will use health checks and auto-scaling policies to ensure enough instances. Being stateless also aids reliability: if one server crashes, user sessions aren’t lost (since state is in Redis/Mongo) and the load balancer will route traffic to healthy servers.

- **MongoDB Scalability & Reliability:** We deploy MongoDB as a **replica set** (at least one primary and two secondaries) for high availability. This ensures that if the primary node fails, a secondary can be promoted automatically, minimizing downtime. MongoDB will hold our growing data (questions, attempts, etc.), so we plan for scaling:
  - **Sharding:** If the data volume or write throughput becomes very large (e.g., millions of attempts daily), we can shard the `Attempts` and `Questions` collections across multiple nodes. A good shard key might be something like `userId` or `topicId` depending on access patterns (to distribute load evenly). MongoDB’s horizontal scale-out with sharding allows partitioning data across nodes transparently ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=MongoDB%20vs)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=MongoDB%20vs)).
  - **Indexes:** We create indexes on fields frequently queried: `userId` and `topicId` in Attempts for analytics, maybe `sessionId` as well; `email` or `googleId` in Users for login lookup; etc. Proper indexing ensures queries (especially those by the analytics endpoint or progress retrieval) remain fast as data grows.
  - **Throughput:** MongoDB can handle high insert rates, but if needed, we could enable **write concern adjustments** or use MongoDB Atlas which can auto-scale throughput. In our use-case, the most write-intensive part is logging attempts. This can be scaled by sharding or by buffering via a queue as mentioned.
  - **Backups:** Regular backups of MongoDB (or using managed Mongo with point-in-time recovery) are configured, to prevent data loss beyond the replica set failures.

- **Redis Scalability & Reliability:** Redis is a potential single point of failure if not configured properly, since it holds active session data. To address this:
  - We use **Redis replication** with a primary-replica setup, and enable Redis Sentinel or Cluster for failover. If the primary goes down, a replica can take over. This avoids dropping all sessions in case of a Redis crash.
  - We enable AOF (Append Only File) persistence or regular RDB snapshots on Redis to allow recovery of session state in case of a restart. However, since sessions are short-lived and not critical to preserve beyond a small window, this is more for disaster recovery. Losing Redis means active quizzes might be interrupted (we can potentially recover by re-deriving state from Mongo Attempts as discussed, but real-time continuity might be lost).
  - **Scaling Redis:** If we have thousands of concurrent sessions, memory usage could grow. We can scale vertically (add RAM) or use Redis Cluster (sharding) to distribute session keys across multiple nodes ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=shard%20keys,sharding%20data%20across%20multiple%20nodes)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=shard%20keys,sharding%20data%20across%20multiple%20nodes)). For example, hash the sessionId to decide which Redis shard holds that session’s data. Redis Cluster does have limitations (no multi-key operations across shards, and eventual consistency) ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Redis%20Cluster%20doesn%E2%80%99t%20guarantee%20strong,among%20databases%20tested%20by%20Jepsen)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Redis%20Cluster%20doesn%E2%80%99t%20guarantee%20strong,among%20databases%20tested%20by%20Jepsen)), but for independent sessions that’s acceptable. We must ensure our usage (mostly single-key ops per session) is compatible with clustering. If using cluster, we’d ensure the session’s keys share a keyslot (e.g., by including a hashtag in the key names like `session:{sessionId}|...` to stick related keys to the same shard). This way, scaling to many sessions is achievable without performance loss. 
  - We will monitor Redis memory and latency closely (using Redis metrics). If needed, LRU eviction can be enabled for cache data, but session data should ideally not be evicted arbitrarily. Thus capacity planning is important.

- **Adaptive Engine & LLM Services:** The components that generate questions (LLM) and evaluate code (static analyzer) need to scale and be reliable:
  - **LLM Service:** If using an external API (like OpenAI or a cloud AI service), we must handle rate limits and latency. We might implement a **queue** for question generation requests such that if 100 students start at once, we don’t overload the API. The queue can distribute requests and workers can fetch from it. If using an in-house model, we’d host it on a dedicated server or container (possibly with GPU for large models). We might run multiple instances of the generator service behind an internal load balancer to handle concurrent requests. Caching can also help: if two users start the exact same topic around the same time, we could reuse one set of generated questions for both (provided academic integrity isn’t compromised). However, since each user should ideally get a unique quiz (to discourage sharing answers), caching of questions might be limited to maybe reusing across attempts for the *same user* if they retry. 
    - **Timeouts & Fallbacks:** We will set a reasonable timeout for the generation call (e.g., a few seconds). If the LLM service fails or times out, the system can fallback to a stored question bank (perhaps use some pre-generated questions from a library so the user isn’t blocked). This ensures reliability even if the AI generation fails – the quiz can still proceed with static content (though less tailored). Similarly, if the LLM returns unusable output, we catch that and either retry or fallback.
    - **Nightly Retraining Deployment:** After the nightly pipeline improves the model or prompt, we update the generator service (e.g., update the prompt template or load a new model version). We should do this in a controlled way, perhaps A/B testing new prompts on a subset of users to ensure it’s beneficial before full rollout.
  
  - **Static Analysis Service:** This might be a CPU-intensive task (parsing code, running checks). We can implement it as a separate service (for example, a pool of worker processes or a microservice written in a language suited for parsing, like Python with ast or a custom checker). The API server would call this service (or library) to evaluate code. To scale:
    - If many coding questions are answered concurrently, we spawn multiple analyzer instances (each can be containerized and autoscaled). 
    - Each instance could potentially handle one code evaluation at a time to avoid high CPU spikes. A queue for code submissions can ensure we don’t overload analyzers.
    - Because we avoid running code, our analysis is faster and safer, but it might still involve complex logic (e.g., comparing output of test cases which we might simulate). We ensure this is optimized (maybe limit to small code snippets, or restrict languages to simplify parsing).
    - Reliability: If the static analysis fails (e.g., the submitted code is non-compiling or the analyzer crashes on some edge case), we catch exceptions and can mark the answer as incorrect with feedback like “Analysis failed”. But to be robust, the analyzer should handle syntax errors gracefully (treat as incorrect and maybe return a message to user to debug their code if allowed).

- **Concurrent Session Management:** Since multiple users (or the same user in different topics) can be active, our design ensures isolation. Each session has isolated Redis keys and question set. We use unique session IDs to avoid any crossover. The data models link by session and user, which ensures even if one part fails, others aren’t corrupted. For example, if one user’s adaptive logic misbehaves, it doesn’t affect others because their state is separate.

- **Fault Tolerance and Recovery:**  
  - If **MongoDB** goes down (rare with replicas, but say a network partition), the app might fail critical operations (like fetching questions or logging attempts). We mitigate by having read-replicas and by coding the app to handle transient DB errors (retry a few times, etc.). In worst case, if DB is unavailable, the system could show a maintenance message to users; this is a hard dependency. That’s why we ensure high availability setup for Mongo. 
  - If **Redis** goes down, as discussed, we lose ephemeral session info. Our strategy is that this should not lose permanent data (thanks to Mongo). We could attempt to restore sessions: for each active session, we could recompute `currentQuestion` by counting attempts for that session in Mongo (to know how many were answered) and let the user continue from there, though the adaptive “memory” of recent answers would be reset. This is not ideal mid-quiz; hence we invest in Redis reliability (e.g., backing it with persistent storage) to minimize this scenario. The system could also proactively save a snapshot of session state to Mongo after each question (e.g. update `QuizSessions` doc), which we already do for counts. That way, even if Redis is lost, the session doc has enough info (which question index and score) to restart the quiz close to where it left off.
  - If the **LLM generator** fails for a particular request, as noted, we provide fallback questions. We can maintain a small repository of vetted questions per topic as a backup. This ensures the user can always start a quiz. We log the incident and the ML team can investigate the generation failure later.
  - If a specific **microservice** (like static analyzer or an image service if any) crashes, its tasks can be retried on another instance. Using a job queue with acknowledgments ensures that if a worker dies, the job (answer evaluation) can be picked up by another.

- **Performance Optimization:** We aim for a snappy user experience:
  - Use caching where appropriate: e.g., cache frequent lookups like topic info or user profile in memory on the app server or a Redis cache. This avoids hitting the DB for repetitive reads (like every question submission doesn’t need to refetch the topic). 
  - Use content delivery for any static content (though mostly backend text here).
  - The adaptive logic in Redis ensures we don’t do heavy computations per answer; it’s O(1) operations. Any heavier analysis (like computing big aggregates) is done offline, keeping the online path lean.
  - We also consider using **connection pooling** for both MongoDB and Redis in the app to reuse connections efficiently under high concurrency.

- **Monitoring and Autoscaling:** We will monitor key metrics: CPU, memory of each service, MongoDB operation times, Redis memory hits, etc. If we see high load, we can scale out. For instance, if the number of active sessions skyrockets, we might spawn additional Redis instances and partition new sessions to them (though dynamic scaling of Redis cluster is non-trivial, so we likely over-provision to a comfortable level in advance). App servers can be autoscaled on CPU usage or request rate. The LLM and analysis services can also scale based on their queue lengths or response times.

- **Security Considerations:** 
  - Google SSO means we rely on OAuth tokens – we ensure proper token validation on each request (using Google’s public keys if JWT, etc.). We also enforce that only users from the university’s domain are allowed if needed (Google SSO can give the hosted domain).
  - All API endpoints use HTTPS and require an auth token (except maybe health checks). Admin endpoints (like analytics) require an admin role check.
  - We sanitize and validate inputs, especially for the code answers (even though we don’t execute, we want to avoid storing huge code or harmful strings). MongoDB queries use parameterization to avoid injection since we use drivers properly.
  - Rate limiting could be applied to prevent abuse (e.g., a user hitting submit rapidly to brute-force a question). Our Redis could help implement a rate limiter (using increment and expire to count attempts in a short time window).

- **Reliability Testing:** Before deployment, we would conduct load tests (simulate hundreds of concurrent quizzes) to ensure the system responds within acceptable latency. We also test failover scenarios: e.g., kill the primary Mongo and see that the app continues with the new primary, restart Redis and see how the system behaves. This helps fine-tune our recovery procedures (maybe the app needs to catch a Redis failure exception and inform users to retry).

In conclusion, this architecture leverages scalable technologies (stateless app servers, MongoDB sharding, Redis in-memory speed) and LLM capabilities to deliver an adaptive quiz platform. The design choices, like separating persistent vs real-time data ([[MongoDB Vs. Redis Comparison: Pros And Cons | MongoDB](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)](https://www.mongodb.com/resources/compare/mongodb-vs-redis#:~:text=Based%20on%20its%20configuration%2C%20Redis,as%20a%20system%20of%20record)), logging every detail for ML ([[LLM Observability: Fundamentals, Practices, and Tools](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)](https://neptune.ai/blog/llm-observability#:~:text=LLM%20observability%20is%20the%20practice,understand%2C%20evaluate%2C%20and%20optimize%20it)), and using static analysis for security ([[Static vs. dynamic code analysis: A comprehensive guide](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)](https://vfunction.com/blog/static-vs-dynamic-code-analysis/#:~:text=code%20quality%2C%20and%20mitigate%20risks,standards%2C%20and%20potential%20security%20flaws)), align with building a **production-grade system** that can evolve with data. By planning for horizontal scaling and robust failover, the platform will serve a large user base reliably, while continuously improving its educational effectiveness through the integrated ML feedback loop.
