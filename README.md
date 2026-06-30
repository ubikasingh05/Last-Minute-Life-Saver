# PanicMate

**The Last-Minute Life Saver** — an AI-powered productivity companion that proactively helps you plan, prioritize, and *actually finish* tasks before deadlines, instead of just sending passive reminders.

🔗 **Live App:** [last-minute-life-saver-567804877555.asia-southeast1.run.app](https://last-minute-life-saver-567804877555.asia-southeast1.run.app)
📦 **Repository:** [github.com/ubikasingh05/Last-Minute-Life-Saver](https://github.com/ubikasingh05/Last-Minute-Life-Saver)

---

## Problem Statement

> Build an AI-powered productivity companion that proactively helps users plan, prioritize, and complete tasks before deadlines, rather than just sending passive reminders.

Most productivity tools tell you *that* something is urgent — not *why*, and definitely not *what to do about it right now*. That gap between "I was reminded" and "I actually did it" is where most apps fail users in the last-minute crunch. PanicMate is built to close that gap.

## Solution Overview

Users type their tasks in plain language. Gemini parses them into structured tasks with an urgency ranking and a short reasoning for that ranking, so users immediately understand *why* something is urgent, not just that it is.

From there, PanicMate does three things a passive reminder app doesn't:

1. **Plans the day for you** — "Plan My Day" generates a time-blocked schedule across all open tasks based on urgency and estimated effort.
2. **Acts on overdue items, not just flags them** — for tasks that imply outbound communication (an email, a message, an extension request), the app drafts ready-to-use content via Gemini, so the user can review/edit and send in seconds.
3. **Nudges proactively with context** — instead of a generic "task due soon" alert, the app surfaces a short, specific, AI-generated nudge naming the most urgent item and the next concrete action.

## Key Features

### 🖋️ The "Draft For Me" Engine (Autonomous Execution)
Lowers the barrier to entry by generating the first step of communication-heavy or complex tasks.
- **Email Mode** — context-aware subject lines and bodies, with one-click `mailto:` integration.
- **Writer's Block Mode** — auto-detects writing assignments and drafts a full structural outline (Thesis, Body, Conclusion).
- **Research Mode** — detects study tasks and generates optimized, URL-encoded Google Search deep-links so users can start reading immediately.

### 🎙️ Voice-Activated "Panic Button"
Zero-friction task ingestion via the native browser Web Speech API — dictate tasks instead of typing.

### 🧩 Autonomous Task Decomposition
Detects large, overwhelming tasks (e.g., "Write Final Thesis") and automatically breaks them into 3 bite-sized, checkable sub-tasks.

### ⏱️ Smart De-escalation Time-Blocking
"Plan My Day" dynamically reconstructs your timeline by urgency, and injects a 15-minute "Decompression Break" after every 2 hours of continuous work to prevent burnout.

### 🔔 Proactive Nudge Engine
A lightweight client-side polling system that monitors approaching deadlines. When a task becomes critically due, it queries Gemini for a context-aware, 2-sentence dynamic wake-up banner with a recommended next step.

### 🎨 Anxiety-Reducing UX
A pastel yellow light theme designed to mitigate deadline-induced stress, with strict urgency color-coding (pulsing red borders) for tasks due within a 3-hour window.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Express + Vite |
| AI | Gemini API (`gemini-3.5-flash`) — task parsing, urgency ranking, schedule generation, action drafting, nudge generation |
| Build tooling | Google AI Studio (Build Mode) — vibe-coded, prompt-driven development |
| Version control | GitHub (synced directly from AI Studio) |
| Hosting | Google Cloud Run (Starter Tier, no-billing-account deployment) |

## Google Technologies Utilized

- **Google AI Studio (Build Mode)** — used to vibe-code the full-stack app via natural-language prompting.
- **Gemini API (`gemini-3.5-flash`)** — core intelligence layer: task parsing, urgency reasoning, schedule generation, autonomous action drafting, proactive nudges.
- **Google Cloud Run** — production hosting, deployed directly from AI Studio's one-click deploy.
- **Google Cloud Starter Tier** — free, no-billing-account deployment.

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- A Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/ubikasingh05/Last-Minute-Life-Saver.git
cd Last-Minute-Life-Saver

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### Running Locally

```bash
npm run dev
```

This starts the Vite frontend and Express backend in development mode.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

PanicMate is deployed on **Google Cloud Run** using the Google Cloud Starter Tier (no billing account required), pushed directly via Google AI Studio's one-click deploy.

Live deployment: https://last-minute-life-saver-567804877555.asia-southeast1.run.app

## Project Structure

```
.
├── src/              # React + TypeScript frontend
├── server/           # Express backend
├── public/           # Static assets
├── package.json
└── README.md
```

> Note: adjust this structure to match the actual repository layout if it differs.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project does not currently specify a license. Add a `LICENSE` file to clarify usage rights, or contact the repository owner.

## Acknowledgments

Built with Google AI Studio, the Gemini API, and Google Cloud Run.
