# Wake Up — Transparent AI-Powered News

AI-summarized news with built-in transparency signals to help you think critically about how information is presented.

## Tech Stack

- **Vite** — Build tool
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library
- **React Router** — Client-side routing
- **TanStack Query** — Data fetching (configured; using mock data)
- **Framer Motion** — Animations

## Local Development

### Prerequisites

- Node.js 18+ (recommend [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Setup & Run

```sh
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

## Project Structure

- `src/pages/` — Route components (Index, ArticlePage, CivicToolsPage)
- `src/components/` — Reusable components and shadcn UI
- `src/data/` — Mock data (replace with API when ready)
- `src/lib/` — Utilities

## Deployment

Build the project:

```sh
npm run build
```

The output is in `dist/`. Deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.).
