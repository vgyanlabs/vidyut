# Use Case Scenarios – Learner (MVP)

This document describes realistic learner interactions (use cases) within the MVP scope of the Vidyut Learning Platform. These help align the product with user expectations and clarify core flows.

---

##  Objective

To define key learner-side scenarios that will:
- Guide development and testing
- Ensure MVP functionalities align with user goals
- Serve as a foundation for future user stories

---

## Use Case 1: First-Time Learner Onboarding

**Actor**: New learner  
**Goal**: To register and start exploring available learning paths  
**Scenario**:
1. Learner visits the Vidyut homepage and clicks on "Sign Up"
2. Fills in name, email, and password
3. Receives a success message and is redirected to dashboard
4. Dashboard displays learning paths (e.g., Web Development, DevOps)
5. Learner explores options and selects a suitable path

---

## Use Case 2: Returning Learner Accessing Dashboard

**Actor**: Existing learner  
**Goal**: To log in and continue their learning path  
**Scenario**:
1. Learner clicks "Sign In" on homepage
2. Enters login credentials
3. System verifies and redirects to dashboard
4. Dashboard highlights "In Progress" learning paths  
5. Learner clicks “Continue” on a path to resume where they left off

---

## Use Case 3: Attempting a Quiz

**Actor**: Any learner  
**Goal**: To assess their knowledge in a selected path  
**Scenario**:
1. Learner selects a learning path and clicks on “Start Quiz”
2. System begins quiz with one question per screen
3. Learner selects an answer
4. A summary/explanation appears under selected option
5. Learner clicks “Next” or “Skip”
6. On final question, learner receives total score and completion status

---

## Use Case 4: Tracking Progress

**Actor**: Any learner  
**Goal**: To monitor progress on learning activities  
**Scenario**:
1. On dashboard, learner sees status tags on each learning path  
2. Tags show "Not Started", "In Progress", or "Completed"
3. System updates status automatically based on quiz interactions

---

## Notes

- Only learner-related use cases are included in MVP  
- Other actions like certification, etc., are out of current scope  
- These scenarios may evolve after user feedback and team discussions
