# 📖 BookMatch

A personal book recommendation app that learns from 
what you've read and helps you decide what to read 
next from books you already own.

## Features

- 📚 Add books you've read by typing naturally
- 📸 Scan your bookshelf to build your to-read pile
- ⭐ Rate books you've read
- ✨ 4 types of smart recommendations:
  - **Next Read** — best match to your taste
  - **Coherence** — continues a theme you're exploring
  - **Flow** — matches your reading rhythm
  - **Complete the Map** — fills knowledge gaps
- 📱 Works on mobile browser
- 🔒 Your data stays on your device

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Grok API (xAI) — text parsing + recommendations
- Gemini API (Google) — bookshelf photo scanning
- Google Books API — book details + covers
- localStorage — all data on your device

## Setup

### 1. Clone the repo
\`\`\`bash
git clone https://github.com/me-Maddy16/book_shelf.git
cd book_shelf
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Run locally
\`\`\`bash
npm run dev
\`\`\`

### 4. Open in browser
\`\`\`
http://localhost:3000
\`\`\`

### 5. Enter your API keys in Settings
The app will ask for your API keys on first launch.

Get them free from:
- **Grok**: console.x.ai
- **Gemini**: aistudio.google.com  
- **Google Books**: console.cloud.google.com

## How It Works

1. Add books you have read (type or scan cover)
2. Scan your bookshelf to build your to-read pile
3. Go to "For You" to get recommendations
4. App only recommends books from YOUR pile

## Recommendation Modes

| Mode | Description |
|------|-------------|
| 📖 Next Read | Best match to your reading taste |
| 🔗 Coherence | Continues a theme you're exploring |
| 🌊 Flow | Matches your reading rhythm |
| 🗺️ Complete | Fills gaps in your knowledge |

## Cost

| Service | Cost |
|---------|------|
| Grok API | $25 free credits/month |
| Gemini API | 1,500 free requests/day |
| Google Books API | Free forever |
| Vercel hosting | Free forever |

## Privacy

All your books and preferences are stored in your 
browser's localStorage. Nothing is sent to any server 
except API calls to Grok, Gemini, and Google Books.
Your API keys never leave your device.

## Built With

Built in a single session using Cursor + Claude.
