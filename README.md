# PharmaFlow CRM

PharmaFlow is an advanced, AI-powered Customer Relationship Management (CRM) tool specifically designed for Medical Affairs and Pharmaceutical Sales teams. 

## 🚀 Tech Stack

### Frontend
- **React 19**
- **Redux Toolkit** for state management
- **Tailwind CSS** & **Google Inter Font** for styling
- **Vite** for fast bundling

### Backend
- **Python** & **FastAPI**
- **PostgreSQL** for the robust SQL Database
- **SQLAlchemy** for ORM

### AI Integrations
- **LangGraph** & **LangChain** (Mandatory)
- **Groq API** using the **gemma2-9b-it** model (Mandatory)

---

## 🛠 Features

1. **HCP Directory & Dashboard:** View Healthcare Professionals, engagement scores, and metrics.
2. **Log Interaction:** Two ways to log interaction notes:
   - **Structured Form:** Manual entry form.
   - **AI Chat:** Converse naturally with the AI, which uses LangGraph tools to securely parse details and commit them to the database.
3. **Follow-ups & Schedules:** Manage upcoming visits and milestones.

---

## 🤖 LangGraph Tools

PharmaFlow uses at least 5 AI tools integrated directly into the conversational interface:
1. `log_interaction`: Extracts products and details to automatically log an HCP meeting.
2. `edit_interaction`: Modifies a logged interaction based on its `#IX-XXXX` reference code.
3. `view_interaction_history`: Retrieves past transcripts and context for a specific doctor.
4. `search_hcp`: Cross-references names and facilities against the directory.
5. `schedule_followup`: Automates scheduling for follow-ups and callbacks.

---

## ⚙️ How to Run

### 1. Database Setup (Docker)
We use PostgreSQL. The easiest way to run it is via Docker Compose:
```bash
# From the root directory, spin up the database container
docker-compose up -d
```
*Note: If you do not have Docker, you must install PostgreSQL locally, create a database named `pharmaflow`, and update the `DATABASE_URL` in the `.env` file.*

### 2. Environment Variables
Create a `.env` file in the root directory and ensure it contains your API Keys and the Database URL:
```env
GROQ_API_KEY=your-groq-api-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/pharmaflow
```

### 3. Backend Setup
Create a virtual environment, install requirements, and start FastAPI:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

### 4. Frontend Setup
In a new terminal window, start the Vite development server:
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to view the application!
