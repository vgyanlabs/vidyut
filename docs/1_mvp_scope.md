# MVP Scope – Vidyut Learning Platform

## Objective

Define the minimum viable product (MVP) for the Vidyut Learning Platform, allowing us to go live with a working version that offers immediate value, collects user feedback, and guides future iterations.

## Why MVP?

The MVP is the leanest version of the product that allows early adopters to interact with the core experience. This ensures that we:

- Launch faster
- Validate key assumptions
- Avoid building unnecessary features
- Gather feedback for better iteration

---

## Key User Flow (for MVP)

1. **User Onboarding**
   - Sign up or log in
   - User profile setup (name, email, etc.)

2. **Dashboard**
   - Greet user with a clean landing interface
   - Tiles or cards with key options:
     - Start Quiz
     - View Progress

3. **Quiz Section**
   - User selects:
     - Category (e.g., Web Development)
     - Level (Beginner, Intermediate, Advanced)
   - View question with multiple choice options
   - Submit answer
   - Immediate feedback or summary after submission

4. **Progress Summary**
   - Track quiz history
   - Number of correct/incorrect answers
   - Accuracy or level-wise performance (basic view)

---

## What Will Be Included in MVP

| Feature               | Included in MVP? | Notes                                             |
|-----------------------|------------------|---------------------------------------------------|
| User Login/Signup     | Yes              | Basic email-password auth                        |
| Dashboard UI          | Yes              | Basic wireframe: Start Quiz, View Progress       |
| Quiz Engine           | Yes              | Questions, options, submission, result feedback  |
| Topic/Level Selector  | Yes              | User can choose category + level before quiz     |
| Progress Tracking     | Yes              | Lightweight version, just enough for MVP         |
| Gamification          | No               | Post-MVP phase                                   |
| Content Modules       | No               | Will be part of Learning Mode, later release     |
| Leaderboard           | No               | Future iteration                                 |
| Admin Panel           | No               | Internal tool for future, not required for MVP   |

---

## Tech Scope for MVP

- Frontend: Next.js, Tailwind CSS
- Backend: Node.js (if needed, based on quiz logic)
- Data Storage: JSON/static files for quiz (initially)
- GitHub for documentation and sprint/issue management

---

## Key Assumptions

- Users are mainly final year students or early learners
- The product is usable even without full theory content
- MVP should launch within 2–3 weeks for first feedback loop

---

## Success Criteria

- User can complete at least 1 quiz
- User feedback collected via Google Form or feedback modal
- At least 3 categories and 3 difficulty levels available
- Minimum 20 questions added for testing

---

## Out of Scope (for MVP)

- Video content
- Personalized learning path
- AI-based quiz recommendation
- Comprehensive analytics
- Gamification and social features
- Admin dashboards

---

## Next Step

Once this scope is committed and approved:
- Create user stories for each feature
- Assign tasks to developers
- Begin wireframe finalization
- Start front-end development based on user flow

