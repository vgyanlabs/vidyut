**Prompt:**

> You are a senior fullstack engineer helping me scaffold a production-grade observability platform for LLM apps (chatbots, RAG pipelines, agents).  
>
> Stack:  
> - **Frontend**: Next.js App Router (JavaScript, Tailwind CSS, ShadCN)  
> - **Backend**: Python FastAPI  
> - **DB**: Postgres (open to switching later)  
> - **Optional**: Docker for deployment  
>
> Key MVP Features:  
> - Log LLM prompt input/output  
> - Track latency, token usage, cost per call  
> - Version control for prompts  
> - Manual + automatic evaluation integration  
> - Trace view UI with filters  
> - Auth + API Key management  
>
> Tasks:  
> 1. Scaffold the project directory with best practices (monorepo or clear separation)  
> 2. Init Next.js frontend with Tailwind and ShadCN pre-installed  
> 3. Init FastAPI backend with routes for logging and fetching trace data  
> 4. Add basic Postgres schema: traces, prompts, evaluations, sessions  
> 5. Add basic Docker setup for both frontend and backend  
>
> Reflect on 5–7 different possible sources of architectural or scalability issues in such observability apps, distill those down to 1–2 most likely concerns, and add logs or validations to track those from day one.  
>
> Now generate the full codebase scaffold with basic README instructions.  
