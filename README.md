# 🧭 LLM Observability App – Research Roadmap

## 🔍 Objective
Design and build a production-grade observability platform for LLM apps (chatbots, RAG pipelines, agents) to log, monitor, trace, and evaluate model behavior in real-time.

---

## 🛠️ Team Composition (Student-Led Project)

| Role                   | Count | Notes                                |
|------------------------|-------|--------------------------------------|
| Fullstack Engineer     | 2     | Next.js + Tailwind + FastAPI         |
| ML/LLM Engineer        | 1     | Tracing, Evaluation, Tokenization    |
| Product Coordinator    | 1     | Feature scoping, research sprints    |
| DevOps (Optional)      | 1     | Docker, Deployment, Monitoring       |
| UI/UX Designer         | 1     | Dashboard wireframes & visuals       |

> Rotating team members across roles to gain well-rounded experience.

---

## 🗺️ Roadmap by Phase (with Story Points)

### 🧩 Phase 1: Problem Space & Market Research – *[8 SP]*

- [ ] Define goals: accuracy, cost, drift, latency (1 SP)
- [ ] Competitive analysis: Langfuse, Helicone, Phoenix, etc. (3 SP)
- [ ] Interviews with LLM app builders (1 SP)
- [ ] Research hallucinations, prompt drift, eval metrics (3 SP)

### ⚙️ Phase 2: Core Capabilities Definition – *[13 SP]*

- [ ] Prompt input/output logging (2 SP)
- [ ] Token count, latency, model info (2 SP)
- [ ] Eval metrics (auto + manual) (3 SP)
- [ ] Cost per run, session, user (2 SP)
- [ ] Prompt version control (2 SP)
- [ ] Alerting, threshold setup (2 SP)

### 🧪 Phase 3: Technical Research – *[10 SP]*

- [ ] LangChain callbacks, OpenTelemetry, tracing libs (3 SP)
- [ ] Eval frameworks: Ragas, TruLens, GPT-as-Judge (2 SP)
- [ ] DB comparison: Postgres vs ClickHouse vs Mongo (2 SP)
- [ ] Model SDKs: OpenAI, Ollama, Together.ai (3 SP)

### ⚡ Phase 4: Proof-of-Concept (PoC) – *[14 SP]*

- [ ] Demo UI for trace + logs (3 SP)
- [ ] API routes for logging, cost breakdown (3 SP)
- [ ] Feedback/rating UI + persistence (3 SP)
- [ ] Versioned prompt history + replay (3 SP)
- [ ] Small RAG traceability with Chroma (2 SP)

### 🚀 Phase 5: Expansion – *[12 SP]*

- [ ] Multi-model trace view (2 SP)
- [ ] Dashboard filters + metrics view (3 SP)
- [ ] RBAC + team dashboards (2 SP)
- [ ] Export/share sessions (2 SP)
- [ ] Eval grading pipeline (3 SP)

### 🧱 Phase 6: Prod Readiness – *[10 SP]*

- [ ] User Auth, API key management (2 SP)
- [ ] CI/CD pipeline + testing (unit + E2E) (3 SP)
- [ ] Containerization & deploy scripts (3 SP)
- [ ] Docs + Developer onboarding (2 SP)

---

## 📦 Deliverables (MVP Scope)

- [ ] LLM tracing dashboard
- [ ] Token usage + latency + cost metrics
- [ ] Prompt versioning + diff
- [ ] Manual & auto eval integration (RAG or chatbot)
- [ ] Logs export & visual trace explorer
- [ ] Auth + API Key support

---

## 📚 Suggested Resources

- [ ] [LangSmith Docs](https://docs.smith.langchain.com)
- [ ] [Langfuse OSS](https://github.com/langfuse/langfuse)
- [ ] [TruLens](https://www.trulens.org/)
- [ ] [RAGAS](https://github.com/explodinggradients/ragas)
- [ ] [Phoenix (Arize)](https://github.com/Arize-ai/phoenix)

