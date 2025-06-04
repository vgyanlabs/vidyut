# Vidyut Learning Platform – Product Requirements Document (PRD)

**Prepared By:** Yashas Patil  
**Reviewed By:** Anjum Jahan, Muzammil  
**Date Created:** May 14, 2025  
**Date Reviewed:** May 18, 2025  
**Version:** 1.0 – Initial Draft (Under Review)

---

## Table of Contents

1. [Overview](#overview)  
2. [Objectives & Goals](#objectives--goals)  
3. [Target Users](#target-users)  
4. [Features](#features)  
5. [Additional Sections](#additional-sections)  
6. [Out of Scope](#out-of-scope)  
7. [Technical Requirements](#technical-requirements)  
8. [Assumptions and Dependencies](#assumptions-and-dependencies)  
9. [Risks and Mitigations](#risks-and-mitigations)  
10. [Glossary](#glossary)  
11. [Appendix](#appendix)  

---

## 1. Overview

### 1.1 Executive Summary

The Vidyut Learning Platform is an AI-assisted, quiz-based educational tool focused on Computer Science Engineering (CSE). It aims to deliver adaptive, personalized learning via LLM-powered quizzes and concept reinforcement tools.

**Core Features:**
- Personalized user profiles
- LLM-powered quiz engine
- Progress dashboard
- AI chatbot assistance
- Feedback & recommendation system

---

## 2. Objectives & Goals

### 2.1 Objectives

- Deliver personalized, adaptive CSE learning
- Promote deep conceptual understanding
- Identify and address learning gaps
- Enable progress tracking via dashboards

### 2.2 Goals

- Launch the platform under the “Vidyut” domain
- Enable profile setup and topic selection
- Generate adaptive MCQs using LLMs
- Provide instant feedback and explanations
- Adaptive difficulty model with remediation
- Formal test mode with performance reports
- Support topic switching with progress save
- Integrate chatbot for basic queries
- Feedback system and topic recommendation
- PDF export of quiz sessions
- Combine Quiz + Learning and Test Quiz modes

---

## 3. Target Users

### 3.1 Primary Users

- CSE undergrads, grads, professionals, and self-learners

### 3.2 Platform Administrators

- Ensure uptime, monitor LLMs, and curate AI-generated content

---

## 4. Features

### 4.1 User Authentication & Profile Management

- OAuth (Google) + email/password login
- Profile setup: name, topic, proficiency level
- Progress dashboard and test analysis
- Multi-topic support with saved progress
- Quiz PDF exports

### 4.2 AI-Powered Quiz Engine (Quiz + Learning Mode)

- LLM-generated MCQs by topic/proficiency
- One-question-at-a-time format
- Immediate feedback with explanations

### 4.3 Adaptive Learning Path (Quiz + Learning Mode)

- Adaptive difficulty increase
- Weakness flagging and targeted follow-ups
- Remedial questions + Mastery Check system

### 4.4 Test Quiz Mode (Formal Assessment)

- Timed test initiation by topic
- Sequential/flexible question navigation
- Graded reports with performance analysis

### 4.5 Chatbot Support

- LLM-based chatbot for concept clarification and support

### 4.6 Feedback Mechanism

- Prompted feedback on level-up
- Voluntary feedback via profile

### 4.7 Topic Recommendation Engine

- Suggest next topics based on mastery progression

### 4.8 Notes Generation

- Export Q&A sets (10 or 20) to PDF

---

## 5. Additional Sections

### 5.1 User Stories

#### 5.1.1 Account Management & Personalization

- Create/update profile and preferred topic
- Manage multiple topics with saved progress

#### 5.1.2 Quiz + Learning Mode (Adaptive Learning)

- Dynamic MCQs by topic and proficiency
- One-by-one question delivery
- Immediate feedback and explanations
- Difficulty adapts based on performance
- Follow-up simpler questions and mastery check

#### 5.1.3 Test Quiz Mode (Formal Assessment)

- Timed quizzes with reports
- Performance history stored in profile

#### 5.1.4 Progress Tracking & Guidance

- Visual dashboards
- Topic recommendations upon mastery

#### 5.1.5 Support & Documentation

- Chatbot for basic help
- Export quiz summaries as PDFs

### 5.2 Design and UX Considerations

#### 5.2.1 Intuitive Navigation

- Clear access to profile, dashboard, chatbot, quizzes, and feedback

#### 5.2.2 Responsive and Engaging Design

- Mobile/desktop responsive, visually engaging UI

#### 5.2.3 Clarity and Readability

- Concise formatting for questions and answers

#### 5.2.4 User Feedback and Visual Cues

- Visual indicators for actions and updates

#### 5.2.5 Minimized Cognitive Load

- Single-question flow and clear prompts

#### 5.2.6 Onboarding and Guidance

- Guided setup and contextual help

#### 5.2.7 Use Case Scenarios / Product Flow

- **(Figure 2: Product flow diagram placeholder)**

### 5.3 Success Metrics

#### 5.3.1 User Engagement and Adoption

- Active users (DAU/WAU/MAU), session duration, feature usage, retention

#### 5.3.2 Learning Effectiveness

- Improved performance, mastery check success, mistake reduction

#### 5.3.3 Platform Performance

- Uptime, load speed, LLM API latency, bug reports

#### 5.3.4 Content Quality

- User ratings, audit accuracy of AI-generated content

---

## 6. Out of Scope

- No non-CSE subjects
- No teacher-side functionality
- No social/peer interaction features
- Chatbot won't answer platform/tech support queries
- No LMS integrations (e.g., Moodle) in this phase

---

## 7. Technical Requirements

### 7.1 Frontend Framework

- **Next.js** (server-side rendering, client interactivity)

### 7.2 Backend Technologies

- **FastAPI (Python)** for business logic and APIs

### 7.3 Database

- **MongoDB** for user progress, interactions, logs  
- **PostgreSQL** for structured data like user profiles

### 7.4 LLM Integration

- OpenAI or similar LLM APIs for quiz generation and chatbot

### Infrastructure

- Scalable deployment (Docker, AWS/GCP)
- Support concurrent users with low latency

---

## 8. Assumptions and Dependencies

### 8.1 General Assumptions

- Stable LLM API access
- SME-validated taxonomy and topic sets
- OAuth or SSO available
- UX flows ready before dev sprints

### 8.2 Technical Stack Assumptions

- Next.js + FastAPI integrated with CI/CD
- MongoDB/PostgreSQL partitioned appropriately
- API key access to LLMs is available and stable

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Inaccurate LLM responses | SME review + feedback scoring |
| Chatbot misuse | Context filtering and hardcoded limits |
| Frustrating adaptive difficulty | Tutorial pop-ups explaining logic |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| LLM | Large Language Model |
| MCQ | Multiple Choice Question |
| Quiz + Learning Mode | Adaptive quiz flow |
| Test Quiz Mode | Timed formal assessment |
| Remedial Questions | Simpler questions after failure |
| Mastery Check | Re-test after remediation |

---

## 11. Appendix

- API references  
- Data schemas  
- Style guides and test case sets (placeholder)

---

## 12. Color Pallete and Design
![Image](https://github.com/user-attachments/assets/dea397c4-e756-4462-8abd-8bb6bd417ba2)

Logo for Vidyut where the book represents knowledge and the lightening bolt is for powering up the mind with knowledge.

# Color Pallette
1. Primary Brand Color – Electric Blue
HEX: #007BFF

    Emotion: Trust, intelligence, clarity

    Usage: Buttons, links, headers (30%)

2. Secondary Color – Warm Yellow
HEX: #FFD54F

    Emotion: Excitement, energy, optimism

    Usage: Hover states, highlight boxes, cards (10%)

3. Neutral Background – Soft White
HEX: #FAFAFA

   Clean, modern, easy on the eyes

   Usage: Backgrounds (60%)

4. Supportive Color – Cool Slate Gray
HEX: #37474F

    Adds contrast for text and icons

    Usage: Body text, icons, footer

5. Optional Accent – Aqua Cyan
HEX: #00B8D4

    Fresh, playful tone for badges or status indicators

    Use sparingly (under 5%)

![Image](https://github.com/user-attachments/assets/8df4172e-d609-4350-a280-aa37ec5c38f3)
