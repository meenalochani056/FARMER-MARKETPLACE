# FarmLink — Direct Market Access for Farmers

**Connecting farmers directly to markets through a digital commerce platform.**

FarmLink is a full-stack marketplace concept for farmers, consumers, retailers, and bulk buyers. It helps farmers publish produce and reach buyers directly, while making listings, indicative pricing, order status, and demo payments more transparent.

## Problem and proposed solution

Small and marginal farmers often rely on long, opaque sales chains and have limited access to urban buyers or useful price context. FarmLink provides searchable produce listings, farmer profiles and reviews, direct ordering, stock-aware checkout, and role-based tools for farmers and administrators.

## Features

- Farmer, buyer (individual / retailer / bulk), and admin accounts with JWT authentication and bcrypt password hashes.
- Farmer profiles, verification state, local image uploads, and produce create / read / update / archive.
- Server-side search, category, district, price, season, sorting, and pagination filters.
- Persistent buyer basket, stock validation/reservation, farmer-grouped orders, demo payment, and order history.
- Farmer order actions, buyer delivery tracking, in-app notifications, and delivered-order reviews.
- Admin dashboard, farmer verification, user/product/order/payment/logistics/review/category listing, and market-price management.
- Clearly labeled seeded indicative market-price examples. They are not live or government-reported prices.
- Responsive English UI with a translation-ready locale module.

## Technology and architecture

- **Client:** React, JavaScript, React Router, Axios, CSS, Vite.
- **Server:** Node.js, Express, express-validator.
- **Database:** MongoDB, Mongoose.
- **Authentication:** JWT and bcryptjs.

```text
React pages / components
        ↓ Axios REST API
Express routes → controllers → payment / logistics services → Mongoose models
        ↓
MongoDB
```

## Structure

```text
client/
  public/
  src/
    assets/ components/ context/ hooks/ layouts/ locales/
    pages/ services/ utils/
    App.jsx main.jsx index.css
server/
  config/ controllers/ middleware/ models/ routes/ seed/ services/ utils/
  app.js server.js
.env.example
```

## Prerequisites

- Node.js 20 or later and npm.
- MongoDB Community Server running locally, or a MongoDB connection URI.

## Quick demo without a MongoDB installation

For a short-lived local demonstration, start the Express API with an ephemeral MongoDB database:

```powershell
cd server
npm run demo
```

The demo command seeds all sample users and listings into MongoDB Memory Server, then starts the API on port 5000. It keeps the React → Axios → Express → Mongoose → MongoDB architecture; the database contents are reset when the demo process stops. This option is for local evaluation only. Use a persistent MongoDB URI for normal development or deployment.

## Installation and configuration

Open two terminals from the project root.

1. Copy `.env.example` to `server/.env` and set a private, long `JWT_SECRET` and a working `MONGO_URI`. `CLIENT_URL` should match the client origin.
2. Install and start the API:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

3. In another terminal, install and start React:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173`. The API health endpoint is `http://localhost:5000/api/health`.

Set `VITE_API_URL` in `client/.env.local` only if the API is not at `http://localhost:5000/api`.

## Seed data and demo accounts

With `server/.env` configured and MongoDB available:

```powershell
cd server
npm run seed
```

The seed script creates the four requested product categories and 36 sample listings (10 vegetables, 10 fruits, 9 grains and pulses, and 7 dairy products), along with indicative market prices and sample notifications/review. It uses upserts and does not delete existing records; rerunning it does not duplicate the seeded listings or sample records. It does not overwrite existing account credentials or inventory quantities. Do not use demo credentials in a deployed environment.

| Role | Email | Password |
|---|---|---|
| Farmer | `farmer@example.com` | `Farmer@123` |
| Buyer | `buyer@example.com` | `Buyer@123` |
| Admin | `admin@example.com` | `Admin@123` |

The sample farmer is verified; additional seeded farmers provide pending/verified examples.

## Main REST API

All paths are prefixed by `/api`. Send `Authorization: Bearer <JWT>` for protected routes.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile` |
| Products | `GET /products`, `GET /products/:id`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`, `GET /products/categories` |
| Farmers | `GET /products/farmers/:id`, `GET /products/farmers/:id/products`, `GET /reviews/farmers/:id/reviews` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PUT /orders/:id/status` |
| Payments | `POST /payments/create`, `POST /payments/verify`, `GET /payments/:id` |
| Reviews | `POST /reviews`, `GET /reviews/farmers/:id/reviews` |
| Market prices | `GET /market-prices`, admin `POST /market-prices`, `PUT /market-prices/:id`, `DELETE /market-prices/:id` |
| Logistics | `POST /logistics`, `GET /logistics/:orderId`, `PUT /logistics/:orderId/status` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` |
| Admin | `GET /admin/stats`, `GET /admin/farmers`, `GET /admin/buyers`, `PUT /admin/farmers/:id/verify`, `GET /admin/resources/:resource` |

Product query example: `/products?search=tomato&district=Chennai&page=1&limit=12&sort=price_asc`.

## Demo payment and images

UPI, card, and demo checkout options all use the local mock payment service. A successful mock records a payment and updates order state; **it does not transfer money**. Local development images are written to `server/uploads/` and served by Express. Configure production-grade object storage before deploying user uploads.

Seeded listings use crop-specific local photos or named local SVG illustrations in `client/public/images/produce/`, rather than cycling through unrelated stock images. Image source and license credits for the photographs are in `client/public/images/produce/ATTRIBUTION.txt`.

## Testing and production

Run the server integration tests with `cd server; npm test`. They start an ephemeral MongoDB instance, exercise authentication, farmer verification, product search and ownership, stock reservation/restoration, mock payments, order and logistics transitions, post-delivery reviews, and the seed script. The MongoDB test binary is downloaded on the first test run; this test-only database is not used by the application at runtime. Build the client with `cd client; npm run build`. For a local demo, seed and start the app against the configured MongoDB URI.

For deployment, provide managed MongoDB, unique production JWT secrets, correct CORS origins, HTTPS, request rate limiting, production object storage, and a real payment/logistics integration if needed. Mock payment and demo market data are for demonstration only. The server must be started with the server environment configured; the static client can be served from any compatible hosting provider.
