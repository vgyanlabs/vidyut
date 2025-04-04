```
export const questions: Question[] = [
  {
    id: "1",
    text: "What is the primary purpose of a CPU in a computer system?",
    options: [
      { id: "1a", text: "Execute instructions and perform calculations", isCorrect: true },
      { id: "1b", text: "Store permanent data", isCorrect: false },
      { id: "1c", text: "Connect to the internet", isCorrect: false },
      { id: "1d", text: "Display graphics on the screen", isCorrect: false }
    ],
    difficulty: 1,
    topic: "Computer Architecture",
    explanation: "The CPU (Central Processing Unit) is the primary component that executes instructions and performs calculations in a computer system, often called the 'brain' of the computer."
  },
  {
    id: "2",
    text: "Which of the following best describes RAM?",
    options: [
      { id: "2a", text: "Permanent storage for the operating system", isCorrect: false },
      { id: "2b", text: "Temporary storage for running programs", isCorrect: true },
      { id: "2c", text: "A type of input device", isCorrect: false },
      { id: "2d", text: "The main circuit board of a computer", isCorrect: false }
    ],
    difficulty: 1,
    topic: "Computer Architecture",
    explanation: "RAM (Random Access Memory) provides temporary storage for data and programs that are currently in use. Unlike permanent storage, RAM loses its contents when the computer is powered off."
  },
  {
    id: "3",
    text: "What does the ALU in a CPU stand for?",
    options: [
      { id: "3a", text: "Advanced Logic Unit", isCorrect: false },
      { id: "3b", text: "Array Logic Unit", isCorrect: false },
      { id: "3c", text: "Arithmetic Logic Unit", isCorrect: true },
      { id: "3d", text: "Automated Learning Utility", isCorrect: false }
    ],
    difficulty: 2,
    topic: "CPU Architecture",
    explanation: "ALU stands for Arithmetic Logic Unit. It performs all arithmetic operations (addition, subtraction, etc.) and logical operations (AND, OR, NOT, etc.) in a computer's CPU."
  },
  {
    id: "4",
    text: "In the von Neumann architecture, what is stored together?",
    options: [
      { id: "4a", text: "Data and software", isCorrect: false },
      { id: "4b", text: "Programs and data", isCorrect: true },
      { id: "4c", text: "Hardware and software", isCorrect: false },
      { id: "4d", text: "Input and output devices", isCorrect: false }
    ],
    difficulty: 2,
    topic: "Computer Architecture",
    explanation: "The von Neumann architecture is characterized by storing both programs and data in the same memory. This approach allows the computer to treat instructions as data that can be modified."
  },
  {
    id: "5",
    text: "What is the role of the control unit in a CPU?",
    options: [
      { id: "5a", text: "To perform mathematical calculations", isCorrect: false },
      { id: "5b", text: "To store frequently accessed data", isCorrect: false },
      { id: "5c", text: "To coordinate the operation of the CPU components", isCorrect: true },
      { id: "5d", text: "To connect the CPU to peripheral devices", isCorrect: false }
    ],
    difficulty: 2,
    topic: "CPU Architecture",
    explanation: "The control unit coordinates the activities of all parts of the CPU. It fetches instructions from memory, decodes them, and directs the operation of the other components to execute the instructions."
  },
  {
    id: "6",
    text: "What is pipelining in CPU design?",
    options: [
      { id: "6a", text: "A cooling system for high-performance CPUs", isCorrect: false },
      { id: "6b", text: "Breaking down instruction execution into stages for parallelism", isCorrect: true },
      { id: "6c", text: "A method of connecting multiple CPUs together", isCorrect: false },
      { id: "6d", text: "The process of transferring data between CPU and RAM", isCorrect: false }
    ],
    difficulty: 3,
    topic: "CPU Architecture",
    explanation: "Pipelining is a technique where instruction execution is broken down into several stages, allowing the CPU to work on multiple instructions simultaneously (each at a different stage), increasing throughput."
  },
  {
    id: "7",
    text: "What is the purpose of cache memory in a modern computer system?",
    options: [
      { id: "7a", text: "To store the operating system permanently", isCorrect: false },
      { id: "7b", text: "To provide high-speed access to frequently used data", isCorrect: true },
      { id: "7c", text: "To replace RAM entirely", isCorrect: false },
      { id: "7d", text: "To store backup copies of critical files", isCorrect: false }
    ],
    difficulty: 3,
    topic: "Computer Architecture",
    explanation: "Cache memory is a small, high-speed memory that provides quick access to frequently used data. It reduces the time the CPU needs to wait for data from the main memory (RAM), improving overall system performance."
  }
];```
