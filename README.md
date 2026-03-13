# Open Generative UI

An open-source showcase for building rich, interactive AI-generated UI with [CopilotKit](https://copilotkit.ai) and [LangGraph](https://langchain-ai.github.io/langgraph/). Ask the agent to visualize algorithms, create 3D animations, render charts, or generate interactive diagrams — all rendered as live HTML/SVG inside a sandboxed iframe.

https://github.com/user-attachments/assets/43b134e3-4aaa-455f-b015-31f1524ecb68

## What It Does

The agent produces **generative UI** — not just text responses, but fully interactive visual components:

- **Algorithm visualizations** — binary search, BFS vs DFS, sorting algorithms
- **3D animations** — interactive WebGL/CSS3D scenes
- **Charts & diagrams** — pie charts, bar charts, network diagrams
- **Interactive widgets** — forms, simulations, math plots

All visuals are rendered in sandboxed iframes with automatic light/dark theming, progressive reveal animations, and responsive sizing.

## Quick Start

```bash
# Install dependencies
pnpm install

# Add your OpenAI API key
echo 'OPENAI_API_KEY=your-key' > apps/agent/.env

# Start all services
pnpm dev
```

- **App**: http://localhost:3000
- **Agent**: http://localhost:8123

## Architecture

Turborepo monorepo with two apps:

```
apps/
├── app/       Next.js 16 frontend (CopilotKit v2, React 19, Tailwind 4)
└── agent/     LangGraph Python agent (GPT-5.4, CopilotKit middleware)
```

### How It Works

1. **User sends a prompt** via the CopilotKit chat UI
2. **Agent decides** whether to respond with text, call a tool, or render a visual component
3. **`widgetRenderer`** — a frontend `useComponent` hook — receives the agent's HTML and renders it in a sandboxed iframe
4. **Skeleton loading** shows while the iframe loads, then content fades in smoothly
5. **ResizeObserver** inside the iframe reports content height back to the parent for seamless auto-sizing

### Key CopilotKit Patterns

| Pattern | Hook | Example |
|---------|------|---------|
| Generative UI | `useComponent` | Pie charts, bar charts, widget renderer |
| Frontend tools | `useFrontendTool` | Theme toggle |
| Human-in-the-loop | `useHumanInTheLoop` | Meeting scheduler |
| Default tool render | `useDefaultRenderTool` | Tool execution status |

## Tech Stack

Next.js 16, React 19, Tailwind CSS 4, LangGraph, CopilotKit v2, Turborepo, Recharts

## License

MIT
