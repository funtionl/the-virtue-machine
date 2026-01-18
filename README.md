# Virtue Machine

A positive-first social media web app that uses in-browser AI to audit and enhance all content, keeping the vibe uplifting and joyful.

## Overview

Virtue Machine is a social media platform designed to make people happy about sharing things. Unlike traditional social media where negative reactions can discourage posting, Virtue Machine ensures that every piece of content—posts, comments, and reactions—is reviewed and rewritten by AI to maintain a positive, supportive community atmosphere.

If you don't like something, just scroll away. No downvotes, no negativity—just good vibes.

## Features

- **Create Posts** - Share your thoughts and ideas with the community
- **Comments** - Engage thoughtfully with other users' posts
- **Reactions** - Show appreciation with thumb up/down interactions
- **AI Content Auditing** - In-browser AI reviews all content to ensure positivity
- **AI Content Rewriting** - Content is intelligently rewritten to maintain a positive tone while preserving the original intent
- **Positive-First Design** - Built from the ground up to prioritize uplifting interactions

## Tech Stack

### Frontend

- **Vite** - Next-generation frontend build tool
- **React** - UI library for building interactive interfaces
- **TypeScript** - Type-safe UI development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component primitives
- **react-hook-form** - Form state management
- **React Router** - Client-side routing
- **axios** - API client
- **lucide-react** - Icon library
- **Clerk** - Authentication and user management

### Backend

- **Bun** - Fast JavaScript runtime
- **Express.js** - Web framework for Node.js
- **Prisma** - Modern ORM for database operations
- **PostgreSQL** - Robust relational database

## Getting Started

### Prerequisites

- Node.js/Bun installed
- PostgreSQL database running
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd virtue-machine
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env

# Run database migrations
bun prisma migrate dev

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

### Database

```bash
# Navigate to backend directory
cd backend

# Run migrations
bun prisma migrate dev

# Access Prisma Studio
bun prisma studio

# Reset database (development only)
bun prisma migrate reset
```

### Clerk Webhook Setup

To receive webhooks from Clerk when users are created, you need to set up ngrok for local development to expose your local server to the internet.

#### 1. Install ngrok

Follow the [Clerk webhook setup guide](https://clerk.com/docs/guides/development/webhooks/syncing#set-up-ngrok).

For WSL, run:

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update \
  && sudo apt install ngrok
```

#### 2. Add ngrok Auth Token

Create an account at [ngrok.com](https://ngrok.com) and add your auth token:

```bash
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

#### 3. Start ngrok

Run ngrok to forward your local port 3000 to a public URL:

```bash
ngrok http 3000
```

This will provide you with a public URL (e.g., `https://xxxx-xx-xxx-xxx-xx.ngrok.io`) that you can use to configure your Clerk webhook endpoint.

## Development Workflow

### Frontend Development

```bash
cd frontend
npm run dev        # Start dev server with hot reload
npm run lint       # Run ESLint
npm run type-check # Check TypeScript types
npm run test       # Run tests
```

### Backend Development

```bash
cd backend
bun run dev        # Start server with auto-reload
bun run lint       # Run linting
bun run type-check # Check TypeScript types
bun run test       # Run tests
```

## Project Structure

```
virtue-machine/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API clients + utilities
│   │   └── main.tsx         # Entry point
│   └── package.json
├── backend/                  # Express.js + Bun application
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/      # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Express middleware
│   │   ├── prisma/          # Prisma client
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
└── README.md
```

## Environment Variables

### Frontend

```
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

### Backend

```
DATABASE_URL=postgresql://user:password@localhost:5432/virtue_machine
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Health

- `GET /api/v1/health` - API status check

## Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Philosophy

Virtue Machine is built on the belief that social media should bring people together and make them happy, not anxious or discouraged. Our AI-driven content auditing ensures that every interaction promotes positivity while respecting user intent and authentic expression.

---

**Made with ❤️ to spread positivity**
