# OrganizeUS

## Overview

OrganizeUS is a static web prototype for helping users organize immigration-related records, documents, travel history, dates, and milestones.

This demo is for organization only. It does not provide legal advice, determine eligibility, recommend forms, or claim that a user is ready to file.

## Problem

Immigration processes often require people to organize travel dates, documents, expiration dates, address history, employment history, and important milestones.

## Current MVP features

- Landing page
- Guided onboarding
- Dashboard
- Travel-history organizer
- Document organizer
- Timeline
- Organizational completion overview
- Sample summary
- Responsive layout

## Technology

- HTML
- CSS
- Vanilla JavaScript
- GitHub Pages

## Project structure

- `index.html` - landing page
- `onboarding.html` - guided onboarding flow
- `dashboard.html` - main overview dashboard
- `travel.html` - travel-history organizer
- `documents.html` - document organizer
- `timeline.html` - timeline and progress overview
- `css/styles.css` - shared styles and responsive layout rules
- `js/app.js` - shared page behavior and interactions
- `assets/images/` - space for supporting images
- `assets/prototype/` - prototype image references
- `.gitignore` - local files to exclude from version control
- `README.md` - project notes and setup instructions

## Live Demo

The latest version of the project is automatically deployed with GitHub Pages whenever changes are merged into the `main` branch.

**Live URL:**

https://theffy92.github.io/organize-us/



## GitHub Codespaces

1. Open the repository on GitHub.
2. Click `Code`.
3. Select the `Codespaces` tab.
4. Create a Codespace from `main`.
5. Run:

```bash
python3 -m http.server 8000
```

6. Open the forwarded port when prompted.

## Collaboration workflow

1. Open this repository in your own **GitHub Codespace**.
2. Make sure you're working from the latest `main` branch.
3. Create a new branch for your task. Always create your branch from `main` and **never** work directly on the `main` branch.
4. Make one focused change.
5. Preview and test your changes.

   If **Live Preview** is available, open `index.html` and launch the preview.

   You can also run:

   ```bash
   python3 -m http.server 8000
   ```

   Then open the forwarded port provided by GitHub Codespaces.

6. Commit and push your branch.
7. Open a pull request and wait for it to be reviewed and merged into `main`.
8. Repeat the process for each new task.

Example branch names:

- `feature/travel-form`
- `feature/document-cards`
- `fix/mobile-navigation`
- `style/dashboard-spacing`

## Copilot prompt template

You can use the following prompt with **GitHub Copilot Chat** whenever you need to make a change. **Always create a new branch before asking Copilot to modify the code.**

```text
Review the project before editing.

Make this specific change:
[describe the change]

Requirements:
- Use only HTML, CSS, and vanilla JavaScript.
- Do not add frameworks, packages, or build tools.
- Preserve the existing design.
- Do not change unrelated files.
- Use relative paths.
- Test the result.
- Summarize every file changed.
- If anything is unclear, ask before making assumptions.
- Explain your implementation before modifying multiple files.
```


## Privacy and safety

- The demo uses fictional data.
- Users should not enter real immigration identifiers, addresses, passport numbers, or confidential files.
- The prototype does not upload or securely store documents.
- The prototype does not provide legal advice.
- A production version would require security, privacy, and legal review.

## Current limitations

- No authentication
- No database
- No permanent storage
- No document uploads
- No real reminders
- No real AI integration yet
- No legal analysis
- Fictional sample data only

## Future improvements

- Browser localStorage
- Secure user accounts
- Encrypted storage
- Reminder notifications
- AI-generated organizational summaries
- Document classification
- Links to official resources
- Multilingual support
- Accessibility testing

## Contributors

- Theffy
- Meron
- Serenity
