# OrganizeUS

## Overview

OrganizeUS is an AI-powered web application that helps users organize immigration-related records, documents, travel history, and important milestones throughout their U.S. immigration journey.

The application provides a personalized onboarding experience, generates document checklists based on the user's immigration process, and offers an AI assistant to answer organizational questions.

This demo is intended for organization only. It does **not** provide legal advice, determine immigration eligibility, recommend forms, or indicate that a user is ready to file.

---

## Problem

Immigration processes often require people to organize travel history, important documents, expiration dates, and other personal records over many years.

OrganizeUS helps users keep that information organized in one place, making it easier to prepare for future immigration processes without replacing official guidance or legal advice.

---

## Current MVP Features

### 🤖 AI-powered onboarding
- Conversational onboarding experience
- Supports the following immigration processes in this MVP:
  - Permanent Residency
  - Naturalization
  - F-1 Student Visa

### 📄 Personalized document checklist
- Automatically generates a checklist based on the selected immigration process
- Mark documents as organized
- Progress updates automatically throughout the application

### ✈️ Travel history
- Add and remove travel records
- Automatic calculation of:
  - Total trips
  - Total days outside the U.S.

### 📊 Dashboard
- Personalized greeting
- Immigration process overview
- Organizational completion score
- Document statistics
- Travel statistics
- Suggested next steps

### ⏱ Timeline & Readiness
- Dynamic organizational timeline
- Personalized summary
- Missing document detection
- Shared completion score

### 💬 AI Assistant
- Available throughout the application
- Answers questions about:
  - immigration terminology
  - document organization
  - next organizational steps
- Uses the user's saved profile and document checklist as context
- Does **not** provide legal advice

### 💾 Persistent demo data
- Browser Local Storage
- Demo data persists across page refreshes
- Reset Demo option to restart the experience

### 📱 Responsive interface
- Desktop and mobile friendly

---

## Technology

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Backend

- Python
- Flask

### AI

- Groq API
- Llama 3.3 70B

### Storage

- Browser Local Storage

### Deployment

- GitHub Pages (frontend)
- Render (backend API)

---

## Project structure

- `index.html` — landing page
- `onboarding.html` — AI-guided onboarding
- `dashboard.html` — personalized dashboard
- `travel.html` — travel history
- `documents.html` — document organizer
- `timeline.html` — timeline and readiness overview
- `css/styles.css` — shared styles
- `js/app.js` — application logic
- `assets/images/` — images
- `assets/prototype/` — design references
- `.gitignore`
- `README.md`

---

## Live Demo

The latest version of the frontend is automatically deployed through GitHub Pages whenever changes are merged into the `main` branch.

**Frontend**

https://theffy92.github.io/organize-us/

The AI backend is deployed separately on Render.

---

## Demo Flow

1. Complete the AI onboarding.
2. Select your immigration process.
3. Review the personalized document checklist.
4. Organize your documents.
5. Add travel history.
6. View the updated dashboard.
7. Review the Timeline & Readiness page.
8. Ask questions using the AI assistant.
9. Use **Reset Demo** to restart the experience.

---

## GitHub Codespaces

1. Open the repository on GitHub.
2. Click **Code**.
3. Select the **Codespaces** tab.
4. Create a Codespace from `main`.
5. Run:

```bash
python3 -m http.server 8000
```

6. Open the forwarded port.

---

## Collaboration Workflow

1. Open this repository in your own **GitHub Codespace**.
2. Update your local `main` branch.
3. Create a feature branch from `main`.
4. Make one focused change.
5. Test your changes locally.
6. If necessary, update your branch with the latest `main`.
7. Commit and push your branch.
8. Open a Pull Request.
9. Merge into `main` after all checks pass.
10. Notify the team that `main` has changed.

Example branch names:

- `feature/onboarding-ai`
- `feature/document-checklist`
- `feature/travel-history`
- `fix/mobile-navigation`

---

## Copilot Prompt Template

You can use the following prompt with **GitHub Copilot Chat** whenever you need to make a change.

```text
Review the project before editing.

Make this specific change:
[describe the change]

Requirements:
- Use only HTML, CSS, and vanilla JavaScript.
- Do not add frameworks.
- Preserve the existing design.
- Do not change unrelated files.
- Use relative paths.
- Test the result.
- Summarize every file changed.
- Explain your implementation before modifying multiple files.
```

---

## Privacy & Safety

- The demo uses fictional data.
- Do not enter real immigration identifiers.
- Do not upload confidential documents.
- OrganizeUS is an organizational tool only.
- The AI assistant does **not** provide legal advice.

---

## Current Limitations

- No authentication
- No database
- Local Storage only
- No document uploads
- No reminder notifications
- No OCR
- No eligibility analysis
- No legal advice

---

## Future Improvements

- User accounts
- Cloud database
- Encrypted storage
- Reminder notifications
- AI-generated organizational summaries
- Links to official USCIS resources
- Multilingual support
- Accessibility improvements

---

## Contributors

- Meron
- Renesh
- Serenity
- Theffy (Elena Estefania)
