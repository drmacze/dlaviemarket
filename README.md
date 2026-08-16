# DLavie Market

Modern virtual-number marketplace frontend deployed to GitHub Pages.

## Stack

- React 19 + TypeScript
- Vite 8
- GSAP + ScrollTrigger
- Lenis smooth scrolling
- CSS design system with mobile-first responsive layout

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

GitHub Actions publishes the generated `dist/` directory to GitHub Pages at:

`https://drmacze.github.io/dlaviemarket/`

> The current wallet, deposit, authentication, and ordering flows are frontend demos. Production payments, supplier credentials, user balances, and callbacks must be implemented in a secure backend and never exposed in browser code.
