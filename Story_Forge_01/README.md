# StoryForge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**StoryForge** is a secure, intuitive platform for writers to upload, manage, and organize their creative works—short stories and playscripts—with professional formatting, version control, and collaboration features.

---

## 📖 Overview

StoryForge aims to become the ultimate writing companion, reducing document management overhead so you can focus on your craft. Whether you’re drafting a short story or formatting a complex playscript, StoryForge provides a unified workspace with powerful tools:

- **Secure authentication** (email, OAuth, 2FA)
- **Rich, specialised editors** for stories and playscripts
- **Automatic versioning** and change tracking
- **Advanced organisation** with tags, series, and full‑text search
- **Flexible export** to PDF, DOCX, EPUB, and industry‑standard formats
- **Optional collaboration** with real‑time co‑editing and feedback

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

## 🧰 Tech Stack

| Layer        | Technology Choices |
|--------------|---------------------|
| **Frontend** | React / Vue.js with TypeScript |
| **Backend**  | Node.js or Python (Django / FastAPI) |
| **Database** | PostgreSQL + Redis for caching |
| **File Storage** | AWS S3 (or similar) + CDN |
| **Real‑time** | WebSockets (Socket.io) |
| **Search**   | Elasticsearch / PostgreSQL full‑text search |
| **Mobile**   | React Native / Flutter (Phase 2) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later) / [Python](https://python.org) (if using Django/FastAPI)
- [PostgreSQL](https://postgresql.org/)
- [Redis](https://redis.io/)
- AWS account (for S3 storage, optional during development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pMtumbuka/soul-builder-spark.git
   cd storyforge
