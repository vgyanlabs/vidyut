# UX & Design Considerations – Learner Side (MVP)

This document outlines the core design principles and experience-related decisions for the MVP of the Vidyut Learning Platform, focusing only on the learner side.

---

## Overall Design Goals

- Keep the interface minimal, clean, and student-friendly  
- Ensure mobile responsiveness for accessibility across devices  
- Use a neutral color palette (refer to style guide)  
- Prioritize clarity and ease of navigation  

---

## Page-wise Considerations

### 1. Sign Up / Sign In Page

- Simple, distraction-free form  
- Visible toggle between Sign Up and Login  
- Helpful validation messages (e.g., "Password must be 8+ characters")  

---

### 2. Dashboard (After Login)

- Welcome message with learner's name  
- Display of all learning paths in card format  
  - Each card includes: Title, Level (Beginner/Intermediate), short description, and “Explore” button  
- Option to filter by level  
- Show learner's progress status (e.g., "In Progress")  

---

### 3. Learning Path Detail Page

- Clear hierarchy of sections:  
  - Overview  
  - Topics Covered  
  - Difficulty Level  
  - Estimated Time  
  - “Start Quiz” button  
- Clean layout with adequate spacing and simple formatting  

---

### 4. Quiz Page

- One question per screen for clarity  
- Multiple Choice Question (MCQ) format with radio buttons  
- After a learner selects an answer:
  - A short explanation or summary appears below the selected option, helping the learner understand the correct answer  
- Navigation controls:
  - “Next” button  
  - Optional “Skip” button  
- After the final question, display a summary page with:
  - Total score  
  - Progress  
  - Suggestions for improvement (optional for MVP)

---

### 5. Progress Tracker

- Visual indicator like a progress bar or status tags  
- Shows current state: Not Started / In Progress / Completed  
- Updates automatically based on quiz participation and learning path activity  

---

## Accessibility & Inclusivity

- Maintain high color contrast for readability  
- Keyboard-friendly navigation  
- Use simple, beginner-friendly language throughout the UI  

---

## Layout Suggestions

- Prototypes and wireframes will be created separately using tools like Miro, Draw.io, app.diagrams.net or Figma  
- Suggested wireframes:
  - Dashboard
  - Learning Path Details
  - Quiz Interface  

Note: Wireframes will be stored separately in a `/design` folder or linked from this document once created.
