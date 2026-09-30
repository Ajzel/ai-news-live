# 🤖 AI News Live

A high-performance, real-time AI news aggregator that sources data from official AI blogs, research papers, and community platforms.

## ✨ Features

- **Multi-Source Aggregation**: Real-time data from OpenAI, Anthropic, Google DeepMind, ArXiv, Hacker News, and Reddit.
- **Real-time Feed**: Powered by SWR with 5-minute polling for instant updates.
- **SEO Optimized**: Implements Next.js ISR (Incremental Static Regeneration) for lightning-fast initial loads and high SEO scores.
- **Robust Safeguards**:
  - **Data Validation**: Zod schemas ensure all news items are correctly formatted.
  - **Network Resilience**: Custom fetch wrappers with timeouts to prevent hanging requests.
  - **Rate Limiting**: Upstash Redis implementation to protect the API from abuse.
- **Authentication**: Secure user login and signup via Supabase.
- **Responsive Design**: Fully mobile-responsive UI built with Tailwind CSS.

## 🛠 Tech Stack

### Frontend (Deployed to Vercel)
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: SWR (Stale-While-Revalidate)
- **Auth**: Supabase Auth

### Backend (Deployed to Render)
- **Runtime**: Node.js / Express
- **Language**: TypeScript
- **Rate Limiting**: Upstash Redis
- **Scraping**: Cheerio & RSS-Parser
- **Validation**: Zod

## 🏗 Architecture

The project is split into two independent services to maximize scalability:

1. **Backend Service**: A standalone API that handles the "heavy lifting" of scraping and normalizing data from various sources. It acts as a single source of truth for the frontend.
2. **Frontend Service**: A lightweight Next.js application that consumes the Backend API and provides a polished user interface.

## 🚀 Getting Started

### Local Development

**1. Backend Setup**
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

**2. Frontend Setup**
```bash
# In the root directory
npm install
# Create a .env file (see Environment Variables section)
npm run dev
```

### Environment Variables

**Backend `.env`:**
- `UPSTASH_REDIS_REST_URL`: Your Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis Token
- `NEWS_API_KEY`: Your NewsAPI.org key
- `ALLOWED_ORIGINS`: `http://localhost:3000` (or your Vercel URL)

**Frontend `.env`:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `NEXT_PUBLIC_BACKEND_URL`: `http://localhost:3001` (or your Render URL)

## 🚢 Deployment

### Render (Backend)
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### Vercel (Frontend)
- Framework Preset: `Next.js`
- Root Directory: `./`
