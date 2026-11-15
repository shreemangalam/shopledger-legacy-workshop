# ShopLedger repository guide

ShopLedger is a Node.js and Express app for point-of-sale billing, inventory, GST invoices, and khata customer credit. Run project commands from this directory.

## Project layout

- `server.js` configures Express, serves `public/`, mounts the API under `/api`, and serves printable invoices at `/orders/:id/invoice`.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` implement the browser UI in plain HTML, JavaScript, and CSS.
- `routes/` contains the products and coupons, orders, customers, and reports routers. The reports router also handles pricing previews and admin export.
- `lib/` contains the order, inventory, pricing, tax, coupon, ledger, invoice, report, date, and storage logic. Server modules use CommonJS.
- `config.js` contains shop settings and business defaults. `lib/store.js` reads and writes `data/db.json`, which stores products, orders, customers, settlements, audit entries, and ID counters.
- [Architecture diagram](docs/architecture.svg) maps the local modules and the POS checkout flow.

## Workshop rules

- Write characterization tests before changing application behavior.
- Limit application changes to [GitHub issue #2](https://github.com/SampurnR/shopledger-legacy-workshop/issues/2).
- For issue #2, limit application code changes to `lib/inventory.js` and `lib/orders.js`.
- Automated tests must use only in-memory fixtures and must never read or write `data/db.json`.
- Add no dependencies.
- Run the workshop test suite with `node --test` from the repository root.

## Run and verify

- Install dependencies with `npm install` and start with `npm start`. The default address is `http://localhost:3000`. Set `PORT` to choose another port.
- `npm test` is a placeholder that exits with status 1. Use `node --check` for additional syntax checks on changed JavaScript files.
- Order creation, cancellation, and settlement write to the checked-in `data/db.json`. For manual write-path smoke checks, use a disposable checkout when preserving that fixture.

## Order and inventory changes

- Trace checkout from the Place Order handler in `public/js/app.js` to `POST /api/orders` in `routes/orders.js`. The server resolves catalog items, validates stock, calculates totals, optionally charges khata, updates stock and orders, and saves through `lib/store.js`.
- `stock` is physical inventory. `reserved` tracks units held for wholesale quotes. The catalog derives sellable quantity through `inventory.getSellableStock`. Persisted order lines identify products with `id`.
- For changes to checkout or cancellation, check the resulting order status, physical stock, wholesale reservations, khata balance where applicable, and audit entry. Cover exact sellable quantities and repeat cancellation when those paths are affected.
