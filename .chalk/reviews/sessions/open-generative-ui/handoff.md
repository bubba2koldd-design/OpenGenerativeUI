# Handoff

## Scope
- Item: open-generative-ui (all changes since initial commit `50d90b3`)
- Goal: Transform the app from a todo-list demo into a generative UI showcase with CopilotKit branding, widget rendering, and polished UX

## What Changed
- Rewrote README to describe generative UI capabilities instead of todo list
- Added CopilotKit brand design system: CSS custom properties, glassmorphism, animated blob background, CTA banner
- Replaced todo-list canvas with chat-only layout (removed `example-canvas/` entirely)
- Built `WidgetRenderer` component: sandboxed iframe renderer with injected theme CSS, SVG pre-built classes, form styles, bridge JS (sendPrompt, openLink, auto-resize), loading skeleton with animated phrases
- Added `ExplainerCardsPortal`: DOM-portal component that injects explainer cards into CopilotKit's welcome screen via MutationObserver
- Removed `mode-toggle.tsx` (Chat/Tasks toggle), `headless-chat.tsx`, and duplicate canvas components
- Updated `ExampleLayout` to single-pane chat-only layout
- Added welcome message and prompt suggestions (binary search, BFS vs DFS, 3D sphere)
- Loaded Plus Jakarta Sans from Google Fonts in layout `<head>`
- Removed unused skill files (`skills/` directory: agent-skills-vol2, master-agent-playbook, renderer-implementation-guide, svg-diagram-skill)

## Files Changed
- README.md (rewritten)
- apps/app/src/app/globals.css (+601 lines of brand CSS)
- apps/app/src/app/layout.tsx (Google Fonts, cleanup)
- apps/app/src/app/page.tsx (new shell with CTA banner, blob bg)
- apps/app/src/components/example-canvas/index.tsx (deleted)
- apps/app/src/components/example-canvas/todo-card.tsx (deleted)
- apps/app/src/components/example-canvas/todo-column.tsx (deleted)
- apps/app/src/components/example-canvas/todo-list.tsx (deleted)
- apps/app/src/components/example-layout/index.tsx (simplified to chat-only)
- apps/app/src/components/example-layout/mode-toggle.tsx (deleted)
- apps/app/src/components/explainer-cards.tsx (new)
- apps/app/src/components/generative-ui/widget-renderer.tsx (heavily expanded)
- apps/app/src/components/headless-chat.tsx (deleted)
- apps/app/src/hooks/use-example-suggestions.tsx (updated suggestions)
- skills/agent-skills-vol2.txt (deleted)
- skills/master-agent-playbook.txt (deleted)
- skills/renderer-implementation-guide.txt (deleted)
- skills/svg-diagram-skill.txt (deleted)

## Risk Areas
- `widget-renderer.tsx` uses `allow-same-origin` in sandbox, which combined with `allow-scripts` could allow iframe to access parent if CSP is misconfigured
- `ExplainerCardsPortal` relies on CopilotKit internal DOM structure (`data-testid="copilot-welcome-screen"`, `.children[0]`, `.lastElementChild`) — fragile across CopilotKit version upgrades
- Lint errors: 2 `setState` inside `useEffect` calls in `widget-renderer.tsx` (lines 414 and 457)
- Lint warning: unused `description` destructured variable in `WidgetRenderer` (line 424)
- Lint warning: custom font loaded outside `_document.js` (Next.js warning in layout.tsx)
- `MutationObserver` on `document.body` with `{ childList: true, subtree: true }` in explainer-cards — performance concern on heavy DOM mutation
- CTA banner links to `https://github.com/CopilotKit/OpenGenerativeUI.git` — `.git` suffix in a browser URL may not resolve correctly
- Hardcoded inline styles mixed with Tailwind and CSS custom properties across page.tsx — inconsistent styling approach

## Commands Run
- `pnpm build`: PASS (compiled successfully, all pages generated)
- `pnpm lint`: FAIL (2 errors, 2 warnings — see risk areas above)

## Known Gaps
- No tests exist for any components
- No Python agent changes reviewed (agent code not changed in this diff)
- Dark mode not validated visually
- Mobile responsiveness not validated
- Accessibility not audited (no ARIA labels on explainer cards, CTA banner)

## Suggested Focus For Reviewers
1. **Security**: `sandbox="allow-scripts allow-same-origin"` on widget iframe — evaluate XSS risk
2. **Lint errors**: `setState` in `useEffect` in `widget-renderer.tsx` — these are flagged as errors, not warnings
3. **Fragile DOM coupling**: `ExplainerCardsPortal` depends on CopilotKit internal DOM structure
4. **GitHub link**: CTA banner `.git` URL suffix
5. **Unused variable**: `description` prop destructured but unused in `WidgetRenderer`
6. **CSS architecture**: Large globals.css with mixed design tokens — some are duplicated (e.g., `--text-primary` vs `--color-text-primary`)
