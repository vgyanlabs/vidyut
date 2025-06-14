export const quizData = {
  topicName: "Advanced JavaScript Concepts",
  totalQuestions: 4,
  questions: [
    {
      id: 1,
      question: "What is the difference between 'let' and 'var' in JavaScript?",
      options: [
        "let has block scope, var has function scope",
        "let has function scope, var has block scope", 
        "They are exactly the same",
        "let is hoisted, var is not hoisted"
      ],
      correctAnswer: 0,
      explanation: "The key difference is that 'let' has block scope while 'var' has function scope. This means variables declared with 'let' are only accessible within the block they're defined in."
    },
    {
      id: 2,
      question: "Which method is used to add elements to the end of an array?",
      options: [
        "unshift()",
        "push()",
        "pop()",
        "shift()"
      ],
      correctAnswer: 1,
      explanation: "The push() method adds one or more elements to the end of an array and returns the new length of the array."
    },
    {
      id: 3,
      question: "What does the 'this' keyword refer to in JavaScript?",
      options: [
        "Always refers to the global object",
        "Always refers to the function itself",
        "Depends on how the function is called",
        "Always refers to the parent object"
      ],
      correctAnswer: 2,
      explanation: "The 'this' keyword in JavaScript refers to different objects depending on how it's used. Its value is determined by how a function is called, not where it's defined."
    },
    {
      id: 4,
      question: "Which of the following is NOT a JavaScript data type?",
      options: [
        "undefined",
        "boolean",
        "float",
        "symbol"
      ],
      correctAnswer: 2,
      explanation: "JavaScript doesn't have a specific 'float' data type. Numbers in JavaScript are stored as double-precision floating-point numbers by default."
    }
  ]
}; 