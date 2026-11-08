# Grevya CRM Technical Documentation

## 1. Project Overview

**Grevya CRM** is an advanced, AI-powered Customer Relationship Management (CRM) platform designed to enhance enterprise workflows with intelligent automation, real-time analytics, and voice-guided assistance. The platform is architected as a modern Single Page Application (SPA) leveraging a serverless backend ecosystem.

### Core Objectives
*   **Intuitive User Experience:** A dark-themed aesthetic with modern UI components.
*   **AI-Driven Insights:** Integrating Anthropic Claude for AI responses and recommendations.
*   **Voice Interactivity:** Guided voice input and dictation powered by AssemblyAI and Web Speech API.
*   **Comprehensive Analytics:** Real-time data visualization with drill-down capabilities.

---

## 2. Technology Stack

### Frontend Architecture
*   **Framework:** React 18 with TypeScript.
*   **Build Tool:** Vite (for fast HMR and optimized production builds).
*   **Routing:** React Router DOM (v6+).
*   **State Management & Data Fetching:** React Query (@tanstack/react-query).
*   **Styling:** Tailwind CSS, PostCSS.
*   **Component Library:** Radix UI primitives integrated via Shadcn UI, providing accessible and customizable components.
*   **Forms & Validation:** React Hook Form coupled with Zod for robust schema validation.

### Backend Integrations & Services
*   **Database & Authentication:** Supabase (PostgreSQL). Handles declarative RLS (Row Level Security), real-time subscriptions, and user identity.
*   **AI Processing:** Anthropic Claude API for LLM-based tasks (e.g., Grevya Assistant).
*   **Speech Recognition:** AssemblyAI / Web Speech API for the "CRM Voice" functionality, allowing field-level dictation and intelligent command processing.

### Visualizations & Utilities
*   **Charts:** Recharts / Chart.js wrappers (used across the Analytics Dashboard).
*   **Drag & Drop:** `@dnd-kit/core` for reorderable lists and kanban boards.
*   **Calendar:** FullCalendar core and React plugins.
*   **File Exports:** `exceljs`, `jspdf`, `xlsx` for comprehensive reporting and data export functionalities.

---

## 3. Directory Structure

The project follows a scalable, feature-first structure within the `src` directory:

```text
src/
├── api/            # API client configurations and interceptors
├── assets/         # Static assets (images, fonts, global icons)
├── components/     # Reusable UI components (Shadcn UI, common layout parts)
├── contexts/       # React Context providers (Theme, Auth, Notification)
├── data/           # Mock data, constants, and static dictionaries
├── hooks/          # Custom React hooks (e.g., useVoice, useAnalytics)
├── lib/            # Utility libraries and third-party wrappers
├── pages/          # Top-level route components and page layouts
├── services/       # Business logic layer (Supabase clients, AI services)
├── supabase/       # Supabase specific configurations and migrations
├── test/           # Unit and integration test suites (Jest/React Testing Library)
├── types/          # Global TypeScript interfaces and type definitions
└── utils/          # Helper functions (formatting, date manipulation, validation)
```

---

## 4. Key Architectural Patterns

### 4.1. The Grevya Voice Assistant
The CRM integrates a sophisticated voice module intended for hands-free operation and rapid data entry.
*   **Guided Voice Input:** Listens to user prompts and maps them directly to complex CRM commands.
*   **Field-Level Dictation:** Allows users to focus on a specific input field and dictate its contents, relying on AssemblyAI for high-accuracy transcriptions.
*   **Web Speech API Fallback:** Ensures continuous operation even if primary cloud transcription services experience downtime.

### 4.2. Analytics Dashboard
The analytics suite is designed for high performance and deep insights:
*   **Dynamic Rendering:** Utilities wrap visualization libraries ensuring a unified aesthetic (custom tooltips, dark mode compatibility).
*   **Multi-Sheet Support modules:** Facilitates Excel uploads with multi-sheet parsing, validating row data on the client side before bulk upserting to Supabase.

### 4.3. Authentication & Security
*   **Supabase Auth:** JWT-based authentication flow. Tokens are securely managed and attached to all data-fetching requests via interceptors.
*   **Row Level Security (RLS):** All Supabase tables are protected by policies ensuring users can only access or modify records belonging to their assigned tenant/organization.

---

## 5. Deployment & CI/CD

The platform is optimized for seamless deployment to modern hosting platforms like Railway, Vercel, or Netlify.

### 5.1. Docker & Containerization
The project includes a `Dockerfile.txt` for containerized environments:
*   **Multi-Stage Build:** Uses Node.js for building the Vite bundle.
*   **Nginx Serving:** Serves the static `dist/` folder using Nginx, configured (`nginx.conf`) to redirect all traffic to `index.html` allowing React Router to handle client-side routing.

---

## 6. Development Lifecycle

### Getting Started
1.  **Install dependencies:** Ensure Node.js is installed, then run `npm install` (or `bun install` as per user preference).
2.  **Start Development Server:** Run `npm run dev` to launch the Vite HMR server.

### State Management Strategy
The application strictly separates **server state** from **client state**:
*   **Server State:** Handled exclusively by React Query. This includes caching, background updates, and pagination for CRM data.
*   **Client State:** Handled by standard React hooks (`useState`, `useReducer`) and Context for UI-specific transient state (e.g., active modal, current theme).

### Theming
The application supports Light/Dark modes, globally managed via `next-themes` and a custom configured Tailwind CSS schema. The dark theme uses deeper grays and sharp contrasts across all Shadcn UI components.

---

## 7. Troubleshooting Common Issues

*   **Build Failures (Docker):** Often caused by lockfile mismatches. Ensure `package-lock.json` or `bun.lock` is synchronized with `package.json` dependencies.
*   **502 Bad Gateway (Nginx):** Check the container logs for application crashes.
*   **Chart Rendering Issues:** If charts fail to load or throw `createChartJSOption` errors, confirm the visualization wrappers are correctly importing from the unified Chart layer rather than legacy ECharts modules.

---

*This documentation is subject to updates as the Grevya CRM architecture evolves.*
