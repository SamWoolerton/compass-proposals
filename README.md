# PDF Proposal Scaffold

A React (Vite) app that renders content as fixed A4 pages and exports to PDF via
the browser's native print — with the on-screen layout matching the PDF **exactly**
(no reflow, no content wrapping onto different pages).

## Run

```bash
npm install
npm run dev
```

Open the URL, hit **Export to PDF**, and in the print dialog choose
**Save as PDF** as the destination.

## How the "exact layout" works

All the machinery is in `src/paged.css`. Four ideas do the work:

1. **Fixed-size sheets in physical units.** Each `.page` is `210mm × 297mm`
   (A4). Authoring in `mm`/`pt` — not `px` — is what makes the screen and the
   paper agree.
2. **`@page { size: A4; margin: 0 }`.** The browser adds *zero* margin of its
   own; all whitespace is padding inside `.page`. This is the single most common
   cause of a stray blank second page, so it must be `0`.
3. **`break-after: page` on each `.page`.** Forces exactly one sheet per page
   element. `:last-of-type` gets `break-after: auto` so there's no trailing blank.
4. **`overflow: hidden` on `.page`.** Content that runs past the sheet is
   *clipped*, never reflowed onto a new page. This is the tradeoff that
   guarantees WYSIWYG: **you** decide where content breaks by splitting it across
   `<Page>` components.

## Gotchas (the stuff that eats an afternoon otherwise)

- **Print dialog settings you can't force from code.** CSS sets sensible
  defaults, but the user's dialog wins. For a clean 1:1 result in Chrome/Edge:
  Margins → **Default** (or None), Scale → **100 / Default**, and **Background
  graphics → ON** if you use coloured fills (this template does).
- **Background colours dropping out.** Needs `print-color-adjust: exact`
  (already set) *and* the "Background graphics" checkbox above. CSS alone can't
  guarantee it.
- **Fonts shifting line breaks.** Load explicit web fonts (this uses Google
  Fonts) so the client's system-font substitution doesn't reflow your lines.
- **Use Chrome or Edge** for the most reliable "Save as PDF". Firefox and Safari
  are close but have occasional margin/scale quirks.
- **US Letter?** Change `--page-w/--page-h` to `8.5in / 11in` and `@page` to
  `size: 8.5in 11in` (or `size: letter`).
- **Rare hairline blank page.** If one appears, drop `--page-h` to `296mm`.

## Files

- `src/paged.css` — the page + print machinery (the important bit) plus the
  sample proposal's styling.
- `src/Page.jsx` — a reusable fixed-size sheet component.
- `src/App.jsx` — a 4-page sample proposal + the Export button. Replace with
  your content.

## Want automatic reflow instead?

If you later want content to *flow* across as many pages as it needs while
keeping print fidelity (page numbers, running headers, footnotes), look at
[**Paged.js**](https://pagedjs.org/). It's heavier, but it's the right tool once
you stop hand-placing every page. This scaffold deliberately keeps pagination
manual because that's what makes the layout exact.
