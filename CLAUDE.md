# CLAUDE.md

## Workflow

- **Do not run builds, tests, or type checking.** The user (Sam) takes care of
  `vite build`, `vite preview`, dev server, and any verification. Make the code
  changes and stop — don't run `npm run build` / `npx vite build` etc.

## Project

- Print-fidelity PDF proposal built with React + Vite. Each `.page` element is
  exactly one A4 sheet on screen and in the exported PDF.
- `src/App.tsx` — all page content. `src/paged.css` — the only file that
  governs print layout (one `.page` == one sheet). `src/Page.jsx` — page shell.
- Content lives inside fixed-size sheets; overflow is clipped, never reflowed.
  Keep additions within the vertical room available on a page.
