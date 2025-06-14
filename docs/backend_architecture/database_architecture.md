# Database Architecture 
### User Schema

The existing `User` schema provides a solid foundation for user authentication and basic profile information. To support the new features, specifically progress tracking and potentially linking users to specific courses or learning paths, the current schema is largely sufficient. The `role` and `institution` fields are valuable for potential future features like analytics or tailored content delivery based on user type or affiliation. No immediate modifications are required for the existing `User` schema based on the current requirements, as authentication is already handled.

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Student', 'Working professional'],
    required: true,
  },
  institution: {
    type: String,
    required: true,
  },
});

// Hash password before saving 
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema); 
```

**Rationale:**
*   **Reusability:** Leveraging the existing schema minimizes changes to the authentication system.
*   **Scalability:** The current fields are generic enough to support various user types and affiliations without immediate need for complex extensions.
*   **Maintainability:** By not altering the core authentication schema, future updates to the authentication logic are less likely to impact other parts of the system.




### Course Schema

The `Course` schema will represent the main learning modules available on the platform. Each course will have a title, a description, and potentially a reference to an image or icon for display on the dashboard. It will also link to the various levels within that course.

```javascript
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  }, // URL to course image/icon
  levels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
    },
  ], // Array of Level Object IDs
});

export default mongoose.model('Course', courseSchema);
```

**Rationale:**
*   **Modularity:** Separating courses allows for easy addition or removal of learning content.
*   **Flexibility:** The `levels` array provides a clear relationship to the `Level` schema, enabling courses to have multiple difficulty levels.
*   **User Experience:** `title`, `description`, and `imageUrl` are essential for presenting courses effectively on the user dashboard.




### Level Schema

The `Level` schema will define the different difficulty levels within a course (e.g., Beginner, Intermediate, Advanced). Each level will have a name, a description, and a static breakdown of concepts covered. This breakdown will serve as a guide for the user before starting a quiz.

```javascript
const levelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"], // Or other specific levels
  },
  description: {
    type: String,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  conceptBreakdown: {
    type: [String], // Array of strings for static concept breakdown
    required: true,
  },
  questionFrequency: {
    type: Number,
    required: true,
  }, // Fixed number of questions for this level
});

export default mongoose.model("Level", levelSchema);
```

**Rationale:**
*   **Granularity:** Separating levels allows for distinct content and question frequencies per difficulty.
*   **Static Content:** The `conceptBreakdown` field directly addresses the requirement for a static guide of concepts, which can be updated manually if needed.
*   **Course Association:** The `course` field links each level to its parent course, maintaining data integrity.
*   **Quiz Control:** `questionFrequency` ensures a fixed number of questions per level as per the requirements.




### Quiz/Question Schema

The `Quiz` schema will store the questions, options, correct answer, and the LLM-generated summary explanation. This is crucial for the export-as-PDF functionality and for tracking individual question performance.

```javascript
const quizQuestionSchema = new mongoose.Schema({
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: Number,  //correct answer will be the index not exactly the same string.
    required: true,
  },
  summaryExplanation: {
    type: String,
    required: true,
  },
  isSubQuestion: {
    type: Boolean,
    default: false,
  }, // To differentiate main questions from sub-questions
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizQuestion',
    required: function() { return this.isSubQuestion; }, // Required only if it's a sub-question
  },
});

export default mongoose.model('QuizQuestion', quizQuestionSchema);
```

**Rationale:**
*   **Data Persistence:** Storing questions and answers ensures that they can be retrieved for PDF export and for review.
*   **LLM Integration:** Fields for `questionText`, `options`, `correctAnswer`, and `summaryExplanation` directly support the LLM-generated content.
*   **Sub-question Handling:** The `isSubQuestion` and `parentQuestion` fields are vital for implementing the logic for wrong answers, allowing the system to generate and track related sub-questions.
*   **Level Association:** Linking questions to a `Level` ensures that quizzes are contextually relevant.




### User Progress Schema

The `UserProgress` schema is central to tracking a user's journey through the courses and quizzes. It will store information about which questions a user has attempted, their answers, whether the answer was correct, and the time taken. This data will be used to populate the dashboard with metrics like 'Courses Completed', 'Hours Learned', and 'Current Streak', as well as to identify areas where a user might be weak.

```javascript
const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  quizQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizQuestion',
    required: true,
  },
  userAnswer: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
  timeTakenSeconds: {
    type: Number,
  }, // Time taken to answer the question
});

export default mongoose.model('UserProgress', userProgressSchema);
```

**Rationale:**
*   **Granular Tracking:** Each entry in this collection represents a single attempt at a question, allowing for detailed analysis of user performance.
*   **Dashboard Metrics:** The `isCorrect` and `answeredAt` fields, combined with aggregation queries, will enable the calculation of 'Courses Completed', 'Hours Learned', and 'Current Streak'.
*   **Weakness Identification:** By tracking `isCorrect` for each `quizQuestion`, we can identify concepts where the user frequently answers incorrectly.
*   **Relationship to Other Schemas:** Strong references to `User`, `Course`, `Level`, and `QuizQuestion` ensure data integrity and facilitate complex queries across collections.




### Schema Relationships and Rationale

**Relationships:**

*   **User to UserProgress (One-to-Many):** A single user can have multiple progress records, each corresponding to a question they have attempted. This is a direct relationship where `UserProgress` documents reference a `User`.
*   **Course to Level (One-to-Many):** A course can contain multiple levels (Beginner, Intermediate, Advanced). The `Course` schema holds an array of `Level` Object IDs, and each `Level` document references its parent `Course`.
*   **Level to QuizQuestion (One-to-Many):** Each level will have many quiz questions associated with it. `QuizQuestion` documents reference a `Level`.
*   **QuizQuestion to QuizQuestion (Self-Referencing, One-to-Many for Sub-questions):** A `QuizQuestion` can be a parent to multiple `QuizQuestion`s (sub-questions generated when a user answers incorrectly). This is managed by the `isSubQuestion` and `parentQuestion` fields within the `QuizQuestion` schema.
*   **QuizQuestion to UserProgress (One-to-Many):** A single quiz question can be attempted by multiple users, or by the same user multiple times. `UserProgress` documents reference a `QuizQuestion`.
*   **UserProgress to Course/Level (Many-to-One):** Each `UserProgress` record is associated with a specific `Course` and `Level` to provide context for the question being answered.

**Overall Rationale for Schema Design:**

1.  **Normalization and Data Integrity:** By separating concerns into distinct schemas (e.g., `Course`, `Level`, `QuizQuestion`), we reduce data redundancy and ensure data consistency. Relationships are established using MongoDB's ObjectId references, which allows for efficient querying and maintaining referential integrity.

2.  **Flexibility and Extensibility:**
    *   **Courses and Levels:** The design allows for easy addition of new courses or new difficulty levels within existing courses without requiring significant schema changes.
    *   **Quiz Content:** The `QuizQuestion` schema is designed to accommodate LLM-generated content, including questions, options, correct answers, and detailed explanations. This makes the system adaptable to future improvements in LLM capabilities (e.g., more complex question types).
    *   **Progress Tracking:** The `UserProgress` schema is granular, capturing each question attempt. This provides a rich dataset for future analytics, personalized learning paths, and more sophisticated dashboard metrics beyond the current requirements.

3.  **Performance Considerations:**
    *   **Referencing:** Using ObjectIds for relationships is generally efficient in MongoDB. For frequently accessed relationships (e.g., `UserProgress` to `User`, `Course`, `Level`, `QuizQuestion`), indexing these fields will be crucial for query performance.
    *   **Denormalization (Limited):** While largely normalized, some limited denormalization (e.g., `questionFrequency` in `Level`) is used where it simplifies queries and improves read performance without introducing significant update anomalies.

4.  **Maintainability:** The clear separation of concerns and well-defined relationships make the codebase easier to understand, debug, and maintain. Each schema has a specific purpose, reducing complexity.

5.  **Future-Proofing:**
    *   **LLM Integration:** The design explicitly accounts for LLM-generated content, making it straightforward to integrate future versions or different LLM providers by simply updating the API endpoints that interact with the LLM service.
    *   **Analytics and Personalization:** The detailed `UserProgress` data lays the groundwork for advanced features like adaptive learning, personalized recommendations, and in-depth performance analytics.
    *   **Content Management:** The `Course` and `Level` schemas provide a structured way to manage educational content, allowing for content updates or additions with minimal impact on the overall system.

This schema design aims to provide a robust, scalable, and flexible foundation for the learning platform, accommodating current requirements while anticipating future growth and feature enhancements.
