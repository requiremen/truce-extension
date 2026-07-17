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

- Node.js 18+
- A Google Cloud project with:
  - Gmail API enabled
  - OAuth 2.0 Client ID (type: Chrome Extension)
- A Gemini API key

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Gemini API key
npm install
npm run dev
```

The backend runs on `http://localhost:3001`.

### 2. Extension

```bash
cd extension
npm install
npm run build
```

Then load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable the **Gmail API**
3. Go to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (type: **Chrome Extension**)
5. Enter your extension ID (shown at `chrome://extensions`)
6. Copy the Client ID into `extension/public/manifest.json` → `oauth2.client_id`

## Development

```bash
# Extension (watch mode)
cd extension && npm run dev

# Backend (watch mode)
cd backend && npm run dev
```

## Architecture

- **Content Script**: Injects a Shadow DOM overlay on `mail.google.com`
- **Service Worker**: Handles OAuth, message passing, and API relay
- **Backend**: Holds the Gemini API key, fetches Gmail data with the user's token, classifies emails via Gemini structured output, and streams results via SSE
- **Templates**: JSON schemas that drive both the AI extraction prompt and the UI rendering
# truce-extension
