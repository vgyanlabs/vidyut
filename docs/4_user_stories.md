# Learner User Stories – MVP

This document outlines the learner-focused user stories for the Vidyut Learning Platform MVP. These stories describe the system from the learner’s perspective and guide the design and development of the platform.

---

## 1️ As a new learner, I want to sign up, so that I can access the platform.

### Acceptance Criteria:
- Learner can create an account using email and password
- System should validate input and show error messages if needed
- Successful sign-up redirects to dashboard

---

## 2️ As a returning learner, I want to sign in, so that I can continue where I left off.

### Acceptance Criteria:
- Learner can enter valid credentials to log in
- Invalid credentials should trigger an error message
- On successful login, dashboard is shown

---

## 3️ As a learner, I want to view all available learning paths, so that I can choose what suits me.

### Acceptance Criteria:
- Dashboard shows categorized paths like Web Dev, DevOps, etc.
- Each path is labelled with Beginner / Intermediate / Advanced
- Learner can click to view more details

---

## 4️ As a learner, I want to see detailed information about a selected learning path, so that I can understand what I will learn.

### Acceptance Criteria:
- Shows summary, topics covered, estimated duration
- Clearly states the intended level (e.g., Intermediate Web Dev)

---

## 5️ As a learner, I want to take a quiz based on my selected path and level, so that I can test my knowledge.

### Acceptance Criteria:
- Learner can start a quiz from the learning path detail page
- Questions are MCQ-style
- At the end, learner sees score and feedback

---

## 6️ As a learner, I want to track my progress, so that I know which paths I have started or completed.

### Acceptance Criteria:
- Dashboard shows "Not Started / In Progress / Completed" status
- System updates the status based on learner activity
