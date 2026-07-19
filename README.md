# MailSort AI

AI-powered Gmail sorting overlay — a Chrome extension that lets you classify, sort, and visualize your inbox using natural language and Gemini AI.

## Project Structure

```
extensionn/
├── extension/     # Chrome Extension (Vite + React, Manifest V3)
├── backend/       # Node.js/Express API server
└── README.md
```

## Prerequisites

- Node.js 16+ (18+ recommended)
- A Google Cloud project with:
  - Gmail API enabled
  - OAuth 2.0 Client ID (type: Chrome Extension)
- A Gemini API key (Get one from [Google AI Studio](https://aistudio.google.com/))

## Quick Start (For Co-founders / Testers)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Gemini API key inside!
npm install
npm run dev
```

The backend runs on `http://localhost:3001`.

### 2. Extension

If you just cloned the repository, you can build the extension using:

```bash
cd extension
npm install
npm run build
```

Then load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right corner)
3. Click "Load unpacked" (top left corner)
4. Select the `extension/dist` folder from this repository.

### 3. Google Account Access (IMPORTANT)

If you are a co-founder or tester cloning this repository, you **cannot** sign in to the extension until the repository owner adds your email address as a **"Test User"** in their Google Cloud Console.

**For the repository owner:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → OAuth consent screen**
3. Under "Test users", click **Add Users** and add your co-founder's Gmail address.

If you don't do this, testers will get a **403 access_denied** error when trying to click "Sign in to Gmail".

## Development

```bash
# Extension (builds changes continuously)
cd extension && npm run dev

# Backend (restarts on file changes)
cd backend && npm run dev
```

## Architecture

- **Content Script**: Injects a Shadow DOM overlay on `mail.google.com`
- **Service Worker**: Handles OAuth, message passing, and API relay
- **Backend**: Holds the Gemini API key, fetches Gmail data with the user's token, classifies emails via Gemini structured output, and streams results via SSE
- **Templates**: JSON schemas that drive both the AI extraction prompt and the UI rendering
# truce-extension
