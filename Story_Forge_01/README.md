# StoryForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**StoryForge** is a secure, intuitive **web platform** for writers to upload, manage, and organize their creative works—short stories and playscripts—with professional formatting and version control.

> ⚡ **Current status**: This is a web‑only project (desktop and mobile browsers). Native mobile apps are planned for a future phase.

---

## 📖 Overview

StoryForge aims to become the ultimate writing companion, reducing document management overhead so you can focus on your craft. Whether you’re drafting a short story or formatting a complex playscript, StoryForge provides a unified **web‑based workspace** with powerful tools:

- **Secure authentication** (email, OAuth, 2FA)
- **Rich, specialised editors** for stories and playscripts
- **Automatic versioning** and change tracking
- **Advanced organisation** with tags, series, and full‑text search
- **Flexible export** to PDF, DOCX, EPUB, and industry‑standard formats
- **Optional collaboration** with real‑time co‑editing and feedback

All features are accessible directly from your browser—no installation needed.

---

## ✨ Features

### Essential

| Area                | Capabilities |
|---------------------|--------------|
| **User Management** | Email/password, Google/Apple OAuth, two‑factor authentication, profile with stats and privacy settings |
| **Workspace**       | Project dashboard with filtering, search, thumbnails, quick stats |
| **Document Creation** | Rich text editor, file upload (DOCX, PDF, TXT, Markdown), templates, batch upload |
| **Specialised Editors** | **Short Story:** chapter organisation, word count, focus mode.<br>**Playscript:** character/dialogue formatting, scene/act structuring, stage directions, character list |
| **Organisation**    | Custom tags, series, status labels, genre, full‑text search with metadata filters |
| **Version Control** | Auto‑save history, manual checkpoints, side‑by‑side compare, rollback, edit timeline |
| **Export & Sharing** | PDF, DOCX, EPUB, HTML, Final Draft, Fountain; shareable links with expiration, password protection, download toggles |
| **Backup & Sync**   | Cloud auto‑backup (AWS S3/Google Drive), cross‑device sync, ZIP export of all works |

### Additional Valuable Features

- **Writing Analytics** – track words per day, streaks, productive hours
- **Distraction‑Free Mode** – full‑screen, typewriter scrolling, custom themes
- **Collaboration** – real‑time co‑editing, comments, suggest mode, permission levels
- **Feedback System** – share with beta readers, annotate, collect private feedback
- **Submission Tracking** (future) – monitor submissions to publishers/contests

---

## 📁 Project Structure (Current)

```
storyforge/
├── public/           # Static assets
├── src/              # React source code
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page views
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   ├── assets/       # Images, fonts, etc.
│   ├── App.tsx       # Main app component
│   ├── main.tsx      # Entry point
│   └── index.css     # Global styles (Tailwind)
├── index.html        # Vite entry
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🧰 Planned Tech Stack

| Layer          | Technology Choices |
|----------------|---------------------|
| **Frontend**   | React with TypeScript (currently in use) |
| **Backend**    | Node.js or Python (Django / FastAPI) – *to be developed* |
| **Database**   | PostgreSQL + Redis for caching |
| **File Storage** | AWS S3 (or similar) + CDN |
| **Real‑time**  | WebSockets (Socket.io) |
| **Search**     | Elasticsearch / PostgreSQL full‑text search |
| **Mobile**     | React Native / Flutter – *planned for Phase 2* |

> **Note:** At this stage, the project is a **frontend‑focused web application** with mock or local storage. Backend services are under active development.

---

## 🚀 Getting Started (Current Web App)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pMtumbuka/StoryForge01.git
   cd StoryForge01

