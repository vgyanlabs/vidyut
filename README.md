AcadAI - Academics for the AI world

This monorepo contains the complete codebase and supporting resources for a full-stack AI-powered application. The project includes a modern frontend, scalable backend, and structured assets to support LLM-based workflows.

Directory Structure

/frontend         → Next.js frontend with Tailwind CSS and JSX
/backend          → FastAPI backend with MongoDB
/prompts          → LLM prompts for various tasks
/context          → Reusable LLM context snippets
/knowledgebase    → Knowledge base for code generation tools and techniques
/backlog          → Product backlog (features, bugs, etc.)
/sprintplanning   → Sprint planning docs including JIRA-based estimations



⸻

Tech Stack

Frontend
	•	Framework: Next.js
	•	Styling: Tailwind CSS
	•	Language: JavaScript (JSX)

Backend
	•	API Framework: FastAPI
	•	Database: MongoDB

AI/LLM Integration
	•	Prompts and Context folders provide structured LLM inputs for use with language models in areas like code generation, chat, and reasoning.

⸻

Setup Instructions

1. Clone the Repo

git clone <repo-url>
cd <repo-name>

2. Install Frontend

cd frontend
npm install
npm run dev

3. Install Backend

cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload



⸻

LLM Assets
	•	/prompts: Prompt templates organized by task and persona.
	•	/context: Modular LLM system/context messages for composability.
	•	/knowledgebase: References and strategies for tool usage (e.g. LangChain, Ollama, etc.).

⸻

Project Management
	•	/backlog: High-level roadmap and issue tracking.
	•	/sprintplanning: Contains sprint goals, JIRA-based estimations, and planning artifacts.

⸻

Contribution
	1.	Fork the repo
	2.	Create a new branch (git checkout -b feature/your-feature)
	3.	Commit your changes (git commit -am 'Add new feature')
	4.	Push and create 
