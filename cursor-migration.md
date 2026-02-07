# Wake Up — Codebase Overview & Lovable Migration Guide

This document provides a clear overview of the **Wake Up** codebase and step-by-step instructions for disconnecting Lovable dependencies and running the project in a local development environment.

---

## Codebase Overview

### What is Wake Up?

**Wake Up** is an AI-powered news transparency app. It displays AI-summarized news with built-in transparency signals (factual vs. opinion vs. interpretation, source diversity, attribution clarity) to help users think critically about how information is presented.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Build Tool | Vite 5 |
| Language | TypeScript |
| Framework | React 18 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS + shadcn/ui |
| UI Components | Radix UI primitives, shadcn components |
| State & Data | TanStack Query (React Query), mock data |
| Animations | Framer Motion |
| Fonts | DM Sans (body), Playfair Display (display) |

### Project Structure

```
wake-up-ux/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root: QueryClient, Router, TooltipProvider, Toaster
│   ├── App.css / index.css   # Global styles
│   ├── components/
│   │   ├── AppLayout.tsx     # Header, nav (News, Civic Tools), mobile menu
│   │   ├── NewsCard.tsx     # Article card with transparency signals
│   │   ├── NavLink.tsx
│   │   └── ui/              # shadcn components (40+ components)
│   ├── pages/
│   │   ├── Index.tsx        # News feed with topic filter (All, Politics, Climate, Business)
│   │   ├── ArticlePage.tsx  # Article detail with full content breakdown
│   │   ├── CivicToolsPage.tsx  # Em-pact Links — civic tools placeholder
│   │   └── NotFound.tsx
│   ├── data/
│   │   └── mockData.ts      # Mock articles and article detail
│   ├── hooks/
│   ├── lib/
│   └── test/
├── public/
├── vite.config.ts
├── tailwind.config.ts
├── components.json           # shadcn config
└── package.json
```

### Key Features

1. **News Feed** (`/`) — Grid of news cards with topic filter, transparency badges, content breakdown bars
2. **Article Detail** (`/article/:id`) — Full article with labeled content (factual, opinion, interpretation), sources, quoted voices
3. **Civic Tools** (`/civic`) — Placeholder page for civic infrastructure (representatives, legislation, education, organizations)
4. **Transparency Signals** — Color-coded badges for fact, opinion, interpretation, sensational framing

### Data Layer

- All data is **mock** (no backend API)
- `src/data/mockData.ts` exports `mockArticles` and `mockArticleDetail`
- Article 1 has full detail content; others show summary only

### Lovable Dependencies Identified

| Location | Dependency | Purpose |
|----------|------------|---------|
| `vite.config.ts` | `lovable-tagger` | Dev-only plugin that tags components for Lovable AI editing |
| `package.json` | `lovable-tagger` (devDependency) | NPM package |
| `index.html` | Meta tags | `og:image`, `twitter:site`, `twitter:image` pointing to Lovable URLs |
| `README.md` | Lovable project info | Project URL, deployment instructions |

---

## Step-by-Step Migration Plan

### Step 1: Remove `lovable-tagger` from Vite config

Edit `vite.config.ts`:
- Remove the `import { componentTagger } from "lovable-tagger";` line
- Remove `componentTagger()` from the `plugins` array

### Step 2: Remove `lovable-tagger` from package.json

Edit `package.json`:
- Remove `"lovable-tagger": "^1.1.13"` from `devDependencies`

### Step 3: Update index.html meta tags

Replace Lovable-specific meta tags with project-appropriate values:
- `og:image` — Use a placeholder or your own image URL
- `twitter:site` — Use your handle or remove
- `twitter:image` — Same as `og:image`

### Step 4: Update README.md

Replace Lovable-specific instructions with project-specific local development and deployment instructions.

### Step 5: Clean install dependencies

```bash
# Remove node_modules and lockfile (optional, for clean state)
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Step 6: Verify the app runs

```bash
npm run dev
```

Open http://localhost:8080 and verify:
- News feed loads
- Topic filter works
- Article detail page works for article 1
- Civic Tools page loads

---

## Local Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

---

## Environment Notes

- **Node.js**: Required (recommend v18+)
- **Port**: Dev server runs on 8080
- **Package manager**: Project has both `package-lock.json` and `bun.lockb`; use `npm` or `bun` consistently

---

## Post-Migration Checklist

- [x] `lovable-tagger` removed from `vite.config.ts`
- [x] `lovable-tagger` removed from `package.json`
- [x] `index.html` meta tags updated
- [x] `README.md` updated
- [x] `npm install` run successfully
- [ ] `npm run dev` runs without errors (run locally to verify)
- [x] `npm run build` succeeds
- [ ] App loads and functions correctly in browser
