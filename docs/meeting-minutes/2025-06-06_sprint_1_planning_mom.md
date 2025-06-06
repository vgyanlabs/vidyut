# Minutes of Meeting (MOM) – Vidyut Learning Platform  
**Date**: June 6, 2025  
**Duration**: ~1 hour 16 minutes
**Facilitator**: Anjum Jahan 
**Note-taker**: Tejaswini
**Participants**: Tejaswini, Yashas, Anjum  
**Purpose**: MVP Finalization and Sprint 1 Planning  

---

## 1. Recap: Project Documentation Review

Anjum walked the team through the finalized documentation:
- Product Vision, MVP Scope, and Feature List
- User Stories and UX Considerations
- Glossary and Readme
- Alignment on documentation structure and review approach

---

## 2. MVP Feature Finalization

### Course Generation Strategy

Instead of manually uploading or defining three static courses, the Vidyut MVP will use an LLM (Large Language Model) backend to dynamically generate content for **any topic** added by the admin team. 

- There is no fixed list of courses for MVP.
- The system will be capable of generating relevant modules and quiz content for any domain/topic configured.
- This approach ensures flexibility and scalability from Day 1, eliminating the need to predefine fixed courses like Web Development or others.


---

## 3. Quiz Module: Structure and Behavior

### ➤ Quiz Count (Static in MVP, Dynamic Later)
- Beginner: 10 questions  
- Intermediate: 15 questions  
- Advanced: 20 questions  

**Future Enhancement**:  
Hybrid approach using LLM to dynamically adjust question count per topic.

### ➤ Quiz Feedback Logic
- **Correct Answer**: Show correct option + short summary.
- **Wrong Answer**: Show correct answer + short summary.

**Future Enhancement**:  
If answer is wrong, generate 4 additional follow-up questions based on the summary.

---

## 4. Account & Profile Section Decisions

- Password creation rules: Clear guidance to be provided on length, special characters, alphanumeric mix, etc.
- Second onboarding page (Level, Name, etc.) to be simplified.
- New data point to capture:  
  → User role (e.g. Final-year student, Working professional, etc.)  
  → This helps analyze **success metrics** and user segmentation.

---

## 5. Dashboard Design Agreement

- All enrolled courses will be listed with **progress tracking per course**.
- Clicking on a course shows:
  - Topic-wise content
  - Level-based adjustments (Beginner/Intermediate/Advanced)
  - Quiz section for each topic
  - Progress Bar (simple for MVP, adaptive in future)

---

## 6. Sprint 1 Plan (Duration: June 7–13)

**Goal**:  
- Implement Dashboard (Frontend + Backend)
- Implement Quiz Module logic (Static version)

**Responsibilities**:
- **Tejaswini**: Will create and log all tasks/tickets in GitHub.
- **Anjum/Muzammil**: Will review tickets and add acceptance criteria if needed.
- **Muzammil**: Will lead assignment based on team members’ skillset.

---

## 7. Stand-ups & Workflow

- **Daily Stand-up**: 15 min, starting once development begins (likely from June 7 or 8)
- **Sprint Deadline**: June 13  
- **Buffer Period**: June 14–15 (Review, QA, Carryover)

---

## 8. Backlog Management

- Tejaswini to maintain all enhancement ideas in the **backlog**.
- Only finalized and clearly defined tickets will be moved to **To Do** for Sprint 1.

---

### Team Roles – Sprint 1

The following team roles have been defined for the Vidyut MVP:

- **Tejaswini** – Project Manager & UX Lead  
  Will oversee sprint progress, manage coordination, handle documentation, and contribute to wireframe and experience design.

- **Yashas** – Full Stack Developer (Backend)  
  Focused on backend architecture, quiz logic, and integration of the LLM for dynamic course generation.

- **Shravani** – Full Stack Developer (Frontend)  
  Responsible for building the learner dashboard, implementing wireframes, and handling responsive UI components.

- **Vijay B** – Quality Assurance (QA)  
  Will lead all testing, ensure feature validation against acceptance criteria, and document bugs and improvement suggestions.

These roles are defined for Sprint 1 specifically and are open to evolution in future phases based on project needs and team availability.

## 9. Summary

The MVP scope is intentionally narrow to enable faster go-live. Feature requests and enhancements have been captured in the backlog and will be revisited post-MVP. Development ownership has been assigned, and the sprint is expected to begin by June 7.

---

_**Prepared by**: Anjum Jahan_  
_**Approved by**: Muzammil (Product Architect)
