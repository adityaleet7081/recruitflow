# RecruitFlow — AI-Powered Hiring Platform SaaS

RecruitFlow is a multi-tenant Applicant Tracking System (ATS) SaaS built to streamline the hiring process for companies. It enables companies to post jobs, manage candidates via a drag-and-drop Kanban pipeline, automate email correspondence, conduct assessments with anti-cheat proctoring, and use AI to screen and score candidate resumes automatically.

## 🚀 Key Features

*   **Multi-Tenant Organization Accounts:** Companies can sign up, create their profiles, and manage multiple job postings independently.
*   **Drag-&-Drop Kanban Pipeline:** Recruiters can move candidates visually across different hiring stages (Applied, Screening, Interview, Offered).
*   **AI Resume Screening:** Deep integration with OpenAI GPT-4o accurately parses candidate resumes (PDFs) and scores them against the job description.
*   **Proctored Assessments:** Built-in candidate skill assessments with secure proctoring that flags tab-switching or fullscreen exit violations. Auto-submits after 3 violations.
*   **Automated Email Pipelines:** Status updates and test links are dispatched to candidates automatically securely via Nodemailer.
*   **Billing & Subscriptions (Stripe):** Optional SaaS integration for pro/premium usage limits utilizing the Stripe API.

## 💻 Tech Stack

*   **Frontend:** React 18, Vite, TailwindCSS, Zustand (State Management), React Router DOM.
*   **Backend:** Node.js, Express.js.
*   **Database:** PostgreSQL (pg pool).
*   **Authentication:** JWT Auth (JSON Web Tokens), bcryptjs for securely hashing passwords.
*   **AI Integration:** OpenRouter / OpenAI API.
*   **File Uploads:** Multer (Locally hosted PDF storage).

## 🛠️ Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adityaleet7081/recruitflow.git
   cd recruitflow
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   *Create a `.env` file in the `server/` directory and add your environment variables:*
   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/recruitflow
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   OPENAI_API_KEY=your_openrouter_or_openai_key
   EMAIL_USER=your_smtp_email
   EMAIL_PASS=your_app_password
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   CLIENT_URL=http://localhost:5173
   ```
   *Run Database Migrations:* Execute the `.sql` statements located in `server/src/db/migrations/` in sequence to construct the PostgreSQL schema.
   *Start Backend:* `npm run dev`

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   ```
   *Create a `.env` file in the `client/` directory:*
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   *Start Frontend:* `npm run dev`

## 👨‍💻 Author
**Aditya Singh** - *BTech CSE Student*

updated the code of assignment section.
