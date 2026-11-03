# Velstock

Velstock is an interactive, bilingual business and inventory management demonstration built with Astro, React, TypeScript, and Tailwind CSS 4.

## Run locally

```sh
npm install
npm run dev
```

The production build is created in `dist/`:

```sh
npm run build
npm run preview
```

## Netlify deployment

Connect this repository to Netlify. The included `netlify.toml` sets the build command to `npm run build` and the publish directory to `dist`. No environment variables, server functions, database, or external services are required.

Use Node.js 24.22.1 (also specified in `.nvmrc` and `netlify.toml`).

## Demo behavior

- English routes: `/en` opens the dashboard; `/en/dashboard`, `/en/inventory`, `/en/sales`, `/en/customers`, `/en/reports`, and `/en/settings` are directly addressable.
- Spanish routes: `/es/dashboard`, `/es/inventory`, `/es/sales`, `/es/customers`, `/es/reports`, and `/es/settings`.
- The root routes `/` and `/es/` also open their respective dashboards.
- Product, customer, and sale changes are held only in React memory. Refreshing the page restores the original fictional dataset.
- Sales are simulated: completing one immediately updates in-memory inventory and reporting but does not process a payment.
- All people, businesses, products, and transactions are fictional. No data leaves the browser.
