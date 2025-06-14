# API Architecture and Endpoints

### API Design Principles

The API design for this learning platform follows RESTful principles with a focus on maintainability, scalability, and ease of integration. The architecture is designed to be modular, allowing for easy extension and modification of individual components without affecting the entire system. Each endpoint is designed with clear responsibilities, consistent naming conventions, and comprehensive error handling.

**Core Design Principles:**

1.  **RESTful Architecture:** Following REST conventions for HTTP methods (GET, POST, PUT, DELETE) and resource-based URLs.
2.  **Consistent Response Format:** All API responses follow a standardized format with status codes, data, and error messages.
3.  **Modular Design:** APIs are grouped by functionality (courses, levels, quizzes, progress) to enable independent development and maintenance.
4.  **Authentication Integration:** All protected endpoints integrate with the existing authentication system.
5.  **Error Handling:** Comprehensive error responses with meaningful messages and appropriate HTTP status codes.
6.  **Pagination:** For endpoints that return lists, pagination is implemented to handle large datasets efficiently.
7.  **Validation:** Input validation on all endpoints to ensure data integrity and security.

###  Course Management APIs

The Course Management APIs handle the creation, retrieval, updating, and deletion of courses. These endpoints are primarily used by administrators or content managers to manage the course catalog.

**GET /api/courses**
*Purpose:* Retrieve all available courses for display on the dashboard.
*Authentication:* Required (any authenticated user)
*Response:* Array of course objects with basic information

```javascript
// Response Format
{
  "status": "success",
  "data": [
    {
      "_id": "course_id",
      "title": "Advanced JavaScript",
      "description": "Master advanced JavaScript concepts...",
      "imageUrl": "https://example.com/js-course.png",
      "levels": ["level_id_1", "level_id_2", "level_id_3"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**GET /api/courses/:courseId**
*Purpose:* Retrieve detailed information about a specific course, including its levels.
*Authentication:* Required
*Response:* Detailed course object with populated level information

```javascript
// Response Format
{
  "status": "success",
  "data": {
    "_id": "course_id",
    "title": "Advanced JavaScript",
    "description": "Master advanced JavaScript concepts including closures, prototypes, async programming, and modern ES6+ features.",
    "imageUrl": "https://example.com/js-course.png",
    "levels": [
      {
        "_id": "level_id_1",
        "name": "Beginner",
        "description": "Introduction to basic JavaScript concepts",
        "conceptBreakdown": ["Variables", "Functions", "Objects", "Arrays"],
        "questionFrequency": 15
      },
      {
        "_id": "level_id_2",
        "name": "Intermediate",
        "description": "Intermediate JavaScript concepts",
        "conceptBreakdown": ["Closures", "Prototypes", "Async/Await", "ES6 Features"],
        "questionFrequency": 20
      }
    ]
  }
}
```

**POST /api/courses**
*Purpose:* Create a new course (Admin only)
*Authentication:* Required (Admin role)
*Request Body:* Course details including title, description, and imageUrl

**PUT /api/courses/:courseId**
*Purpose:* Update an existing course (Admin only)
*Authentication:* Required (Admin role)
*Request Body:* Updated course details

**DELETE /api/courses/:courseId**
*Purpose:* Delete a course and all associated data (Admin only)
*Authentication:* Required (Admin role)
*Response:* Confirmation of deletion

**Rationale for Course APIs:**
The course management APIs provide a clean separation between content management and user interaction. The GET endpoints are optimized for user experience, providing all necessary information for the dashboard and course selection screens. The administrative endpoints (POST, PUT, DELETE) are restricted to admin users, ensuring content integrity. The use of population in the detailed course endpoint reduces the number of API calls needed by the frontend to display complete course information.


### Level Management APIs

Level Management APIs handle the retrieval and management of difficulty levels within courses. These endpoints are crucial for displaying the concept breakdown to users before they start a quiz.

**GET /api/courses/:courseId/levels**
*Purpose:* Retrieve all levels for a specific course
*Authentication:* Required
*Response:* Array of level objects with concept breakdowns

```javascript
// Response Format
{
  "status": "success",
  "data": [
    {
      "_id": "level_id_1",
      "name": "Beginner",
      "description": "Introduction to basic JavaScript concepts",
      "conceptBreakdown": [
        "Variables and Data Types",
        "Functions and Scope",
        "Objects and Arrays",
        "Basic DOM Manipulation",
        "Event Handling"
      ],
      "questionFrequency": 15
    },
    {
      "_id": "level_id_2",
      "name": "Intermediate",
      "description": "Intermediate JavaScript concepts",
      "conceptBreakdown": [
        "Closures and Lexical Scope",
        "Prototypes and Inheritance",
        "Asynchronous Programming",
        "ES6+ Features",
        "Error Handling",
        "Module Systems"
      ],
      "questionFrequency": 20
    }
  ]
}
```

**GET /api/levels/:levelId**
*Purpose:* Retrieve detailed information about a specific level
*Authentication:* Required
*Response:* Detailed level object with concept breakdown

**POST /api/courses/:courseId/levels**
*Purpose:* Create a new level within a course (Admin only)
*Authentication:* Required (Admin role)
*Request Body:* Level details including name, description, conceptBreakdown, and questionFrequency

**PUT /api/levels/:levelId**
*Purpose:* Update an existing level (Admin only)
*Authentication:* Required (Admin role)
*Request Body:* Updated level details

**DELETE /api/levels/:levelId**
*Purpose:* Delete a level and all associated questions (Admin only)
*Authentication:* Required (Admin role)
*Response:* Confirmation of deletion

**Rationale for Level APIs:**
The level management APIs are designed to provide the static concept breakdown that users see before starting a quiz. This information is crucial for setting user expectations and helping them understand what topics will be covered. The nested route structure (/api/courses/:courseId/levels) clearly establishes the hierarchical relationship between courses and levels, making the API intuitive to use. The detailed concept breakdown in the response eliminates the need for additional API calls to fetch this information separately.


### Quiz and Question Management APIs

The Quiz and Question Management APIs are the core of the learning platform, handling question generation, retrieval, and management. These APIs work closely with the LLM service to generate questions and explanations dynamically.

**POST /api/levels/:levelId/quiz/start**
*Purpose:* Initialize a new quiz session for a specific level
*Authentication:* Required
*Response:* Quiz session information and first question

```javascript
// Response Format
{
  "status": "success",
  "data": {
    "quizSessionId": "session_id",
    "levelId": "level_id",
    "totalQuestions": 15,
    "currentQuestionNumber": 1,
    "question": {
      "_id": "question_id",
      "questionText": "What is a closure in JavaScript?",
      "options": [
        "A function that has access to variables in its outer scope",
        "A method to close browser windows",
        "A way to hide variables from global scope",
        "A type of loop in JavaScript"
      ]
    }
  }
}
```

**POST /api/quiz/answer**
*Purpose:* Submit an answer for the current question
*Authentication:* Required
*Request Body:* User's answer and question ID
*Response:* Answer validation, explanation, and next question or sub-questions

```javascript
// Request Format
{
  "questionId": "question_id",
  "userAnswer": "A function that has access to variables in its outer scope",
  "quizSessionId": "session_id"
}

// Response Format (Correct Answer)
{
  "status": "success",
  "data": {
    "isCorrect": true,
    "correctAnswer": "A function that has access to variables in its outer scope",
    "explanation": "A closure is indeed a function that has access to variables in its outer (enclosing) scope even after the outer function has returned. This is a fundamental concept in JavaScript that enables powerful programming patterns like data privacy and function factories.",
    "nextQuestion": {
      "_id": "next_question_id",
      "questionText": "Which of the following demonstrates closure?",
      "options": ["option1", "option2", "option3", "option4"]
    },
    "progress": {
      "currentQuestionNumber": 2,
      "totalQuestions": 15
    }
  }
}

// Response Format (Incorrect Answer)
{
  "status": "success",
  "data": {
    "isCorrect": false,
    "correctAnswer": "A function that has access to variables in its outer scope",
    "explanation": "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned. This concept is crucial for understanding JavaScript's scoping mechanism and enables patterns like data encapsulation and function factories.",
    "subQuestions": [
      {
        "_id": "sub_question_1_id",
        "questionText": "In the following code, what will be logged? function outer() { let x = 10; return function inner() { console.log(x); }; } const fn = outer(); fn();",
        "options": ["10", "undefined", "Error", "null"]
      }
    ],
    "subQuestionMode": true,
    "subQuestionsRemaining": 3
  }
}
```

**POST /api/quiz/sub-question/answer**
*Purpose:* Submit an answer for a sub-question (generated after wrong answer)
*Authentication:* Required
*Request Body:* User's answer and sub-question ID
*Response:* Answer validation and next sub-question or return to main quiz

**GET /api/quiz/session/:sessionId**
*Purpose:* Retrieve current quiz session state
*Authentication:* Required
*Response:* Current question, progress, and session information

**POST /api/quiz/session/:sessionId/complete**
*Purpose:* Mark a quiz session as completed
*Authentication:* Required
*Response:* Quiz completion summary and statistics

**LLM Integration Endpoints (Placeholders):**

**POST /api/llm/generate-question**
*Purpose:* Generate a new question for a specific level (Internal API)
*Authentication:* Service-to-service authentication
*Request Body:* Level information and context
*Response:* Generated question with options and correct answer

**POST /api/llm/generate-explanation**
*Purpose:* Generate explanation for a question answer (Internal API)
*Authentication:* Service-to-service authentication
*Request Body:* Question and correct answer
*Response:* Generated explanation text

**POST /api/llm/generate-sub-questions**
*Purpose:* Generate sub-questions based on a concept explanation (Internal API)
*Authentication:* Service-to-service authentication
*Request Body:* Original question, explanation, and difficulty adjustment
*Response:* Array of generated sub-questions

**Rationale for Quiz APIs:**
The quiz API design addresses the complex flow requirements of the learning platform. The separation between main questions and sub-questions allows for the sophisticated wrong-answer handling logic. The quiz session concept maintains state across multiple question interactions, enabling features like progress tracking and session resumption. The LLM integration endpoints are designed as internal APIs, allowing for easy swapping of LLM providers or updating the LLM service without affecting the main application logic. The response format provides all necessary information for the frontend to render the appropriate UI state, whether showing the next question, sub-questions, or completion summary.


### User Progress and Analytics APIs

The User Progress APIs are essential for tracking user performance and providing dashboard analytics. These endpoints support the dashboard metrics like 'Courses Completed', 'Hours Learned', 'Current Streak', and detailed progress tracking.

**GET /api/user/progress/dashboard**
*Purpose:* Retrieve dashboard analytics for the authenticated user
*Authentication:* Required
*Response:* Comprehensive dashboard metrics

```javascript
// Response Format
{
  "status": "success",
  "data": {
    "coursesCompleted": 12,
    "hoursLearned": 48,
    "currentStreak": 7,
    "totalQuestionsAnswered": 245,
    "correctAnswers": 198,
    "accuracyPercentage": 80.8,
    "weakAreas": [
      {
        "concept": "Closures",
        "incorrectCount": 8,
        "totalAttempts": 12,
        "accuracyPercentage": 33.3
      },
      {
        "concept": "Async Programming",
        "incorrectCount": 6,
        "totalAttempts": 10,
        "accuracyPercentage": 40.0
      }
    ],
    "strongAreas": [
      {
        "concept": "Variables",
        "correctCount": 15,
        "totalAttempts": 15,
        "accuracyPercentage": 100.0
      }
    ],
    "recentActivity": [
      {
        "date": "2024-06-14",
        "questionsAnswered": 8,
        "correctAnswers": 6,
        "timeSpent": 45
      }
    ]
  }
}
```

**GET /api/user/progress/courses**
*Purpose:* Retrieve user's progress across all courses
*Authentication:* Required
*Response:* Array of courses with progress information

```javascript
// Response Format
{
  "status": "success",
  "data": [
    {
      "course": {
        "_id": "course_id",
        "title": "Advanced JavaScript",
        "imageUrl": "https://example.com/js-course.png"
      },
      "overallProgress": 75,
      "levels": [
        {
          "level": {
            "_id": "level_id",
            "name": "Beginner"
          },
          "progress": 100,
          "questionsAnswered": 15,
          "correctAnswers": 13,
          "completedAt": "2024-06-10T10:30:00Z"
        },
        {
          "level": {
            "_id": "level_id_2",
            "name": "Intermediate"
          },
          "progress": 50,
          "questionsAnswered": 10,
          "correctAnswers": 7,
          "lastAttempt": "2024-06-14T14:20:00Z"
        }
      ]
    }
  ]
}
```

**GET /api/user/progress/course/:courseId**
*Purpose:* Retrieve detailed progress for a specific course
*Authentication:* Required
*Response:* Detailed course progress with level-wise breakdown

**POST /api/user/progress/record**
*Purpose:* Record a user's answer to a question (Internal API, called by quiz endpoints)
*Authentication:* Required
*Request Body:* Question attempt details
*Response:* Confirmation of progress recording

```javascript
// Request Format
{
  "courseId": "course_id",
  "levelId": "level_id",
  "questionId": "question_id",
  "userAnswer": "selected_option",
  "isCorrect": true,
  "timeTakenSeconds": 45
}
```

**GET /api/user/progress/streak**
*Purpose:* Calculate and retrieve user's current learning streak
*Authentication:* Required
*Response:* Streak information and streak history

**GET /api/user/progress/weak-areas**
*Purpose:* Identify areas where the user frequently answers incorrectly
*Authentication:* Required
*Query Parameters:* Optional filters for course, level, or time period
*Response:* Analysis of weak areas with recommendations

**GET /api/user/progress/time-analytics**
*Purpose:* Retrieve time-based analytics for learning patterns
*Authentication:* Required
*Response:* Time spent learning, optimal learning times, and productivity metrics

**Rationale for Progress APIs:**
The progress API design focuses on providing comprehensive analytics while maintaining performance through efficient aggregation queries. The dashboard endpoint consolidates multiple metrics into a single call, reducing frontend complexity and improving load times. The separation of different types of progress data (courses, streaks, weak areas) allows for modular frontend development and caching strategies. The internal progress recording API ensures that all user interactions are consistently tracked, providing a reliable foundation for analytics. The weak areas identification is particularly important for the platform's educational value, helping users focus on concepts they need to improve.


### PDF Export API

The PDF Export API enables users to export their quiz questions, answers, and explanations as a PDF document for offline review and study.

**POST /api/user/export/quiz-pdf**
*Purpose:* Generate and download a PDF of completed quiz questions and explanations
*Authentication:* Required
*Request Body:* Export parameters and filters
*Response:* PDF file or download link

```javascript
// Request Format
{
  "courseId": "course_id", // Optional: filter by specific course
  "levelId": "level_id",   // Optional: filter by specific level
  "dateRange": {           // Optional: filter by date range
    "startDate": "2024-06-01",
    "endDate": "2024-06-14"
  },
  "includeCorrectAnswers": true,
  "includeIncorrectAnswers": true,
  "includeExplanations": true,
  "format": "detailed" // or "summary"
}

// Response Format
{
  "status": "success",
  "data": {
    "downloadUrl": "https://api.example.com/downloads/quiz-export-user123-20240614.pdf",
    "fileName": "JavaScript_Quiz_Export_2024-06-14.pdf",
    "fileSize": "2.4 MB",
    "questionsIncluded": 45,
    "expiresAt": "2024-06-21T10:30:00Z"
  }
}
```

**GET /api/user/export/history**
*Purpose:* Retrieve user's export history
*Authentication:* Required
*Response:* List of previous exports with download links

**GET /api/downloads/:fileId**
*Purpose:* Download a previously generated export file
*Authentication:* Required (file ownership validation)
*Response:* PDF file stream

**Rationale for PDF Export API:**
The PDF export functionality is a key differentiator for the platform, allowing users to create study materials from their quiz attempts. The API design supports flexible filtering options, enabling users to export specific courses, levels, or date ranges. The asynchronous generation approach (returning a download URL) ensures that large exports don't block the API response. The temporary download links with expiration dates balance user convenience with storage management. The export history feature allows users to re-download previous exports without regenerating them.


### API Design Patterns and Best Practices

**Authentication and Authorization:**
All API endpoints (except public endpoints like health checks) require authentication using the existing authentication system. The API design assumes JWT-based authentication with user information available in the request context. Role-based access control is implemented for administrative endpoints, with clear separation between user and admin capabilities.

**Error Handling:**
Consistent error response format across all endpoints ensures predictable error handling on the frontend:

```javascript
// Error Response Format
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Email format is invalid"
    }
  },
  "timestamp": "2024-06-14T10:30:00Z"
}
```

**Pagination:**
For endpoints returning lists, consistent pagination parameters and response format:

```javascript
// Pagination Query Parameters
?page=1&limit=20&sortBy=createdAt&sortOrder=desc

// Pagination Response Format
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Rate Limiting:**
API endpoints implement rate limiting to prevent abuse and ensure fair usage:
- Quiz endpoints: 60 requests per minute per user
- Progress endpoints: 100 requests per minute per user
- Export endpoints: 5 requests per hour per user
- Administrative endpoints: 30 requests per minute per admin

**Caching Strategy:**
- Course and level data: Cache for 1 hour (infrequently updated)
- User progress dashboard: Cache for 5 minutes
- Quiz questions: No caching (dynamic content)
- Export files: Cache for 7 days

**API Versioning:**
All endpoints include version prefix (/api/v1/) to support future API evolution without breaking existing integrations.

**Input Validation:**
Comprehensive input validation using schema validation libraries:
- Required field validation
- Data type validation
- Format validation (email, dates, etc.)
- Business rule validation (e.g., question frequency limits)

**Security Considerations:**
- CORS configuration for frontend integration
- Input sanitization to prevent injection attacks
- Rate limiting to prevent abuse
- Secure file upload handling for course images
- Audit logging for administrative actions

**Performance Optimization:**
- Database indexing on frequently queried fields
- Aggregation pipelines for complex analytics queries
- Lazy loading for related data
- Response compression for large payloads
- Connection pooling for database connections

**Monitoring and Logging:**
- Request/response logging for debugging
- Performance metrics collection
- Error tracking and alerting
- User activity analytics
- API usage statistics

**Documentation:**
- OpenAPI/Swagger specification for all endpoints
- Interactive API documentation
- Code examples for common use cases
- Integration guides for frontend developers

This comprehensive API design provides a robust, scalable, and maintainable foundation for the learning platform. The modular structure allows for independent development and testing of different components, while the consistent patterns ensure a smooth developer experience. The design anticipates future growth and feature additions while maintaining backward compatibility through proper versioning and deprecation strategies.
