# RYZE STORES self-hosted backend

Independent production backend for RYZE STORES. It uses Node.js and PostgreSQL and does not depend on Supabase, Firebase, Clerk, or another backend-as-a-service.

## Included

- Custom email/password authentication with Node's memory-hard `scrypt`
- Opaque server-side sessions stored as SHA-256 hashes
- Email-verification and password-reset token lifecycle
- Products, stock, cart, wishlist, addresses, coupons and order APIs
- Transactional checkout with row locks and idempotency keys
- Order timeline, customer cancellation and administrator status controls
- Role-based authorization, audit logs and structured request logs
- CORS allowlist, security headers, request limits and rate limiting
- PostgreSQL 17 migrations and seed data
- Docker Compose stack with a private database network and Caddy HTTPS proxy
- Non-root, read-only API container with dropped Linux capabilities

## Local setup

1. Copy `.env.example` to `.env`.
2. Replace every `CHANGE_THIS...` value with a strong random secret.
3. For local HTTP, use `API_DOMAIN=localhost` and `NODE_ENV=development`.
4. Start the stack:

```bash
docker compose up --build -d
docker compose exec api node scripts/seed.js
docker compose ps
curl http://localhost/health
```

The database is not published to the host. Only Caddy exposes ports 80 and 443.

## Production deployment

1. Use an Ubuntu/Debian VPS with Docker Engine and the Compose plugin.
2. Point an `A`/`AAAA` DNS record such as `api.ryzestores.store` to the server.
3. Set `API_DOMAIN`, `TLS_EMAIL`, and the exact frontend origin in `.env`.
4. Generate secrets with `openssl rand -base64 48` and never commit `.env`.
5. Run `docker compose up --build -d`, then `docker compose exec api node scripts/seed.js` once.
6. Configure daily encrypted `pg_dump` backups to storage you control and test restoration.
7. Keep the host firewall limited to SSH, 80 and 443; keep PostgreSQL private.

## Frontend connection

Set the storefront environment variable:

```env
NEXT_PUBLIC_RYZE_API_URL=https://api.ryzestores.store
```

Requests that use authentication must include credentials:

```js
fetch(`${process.env.NEXT_PUBLIC_RYZE_API_URL}/v1/cart`, {
  credentials: "include"
})
```

For mutating requests, send JSON. Order creation must also send a unique `Idempotency-Key` header.

## Important production boundaries

- The current payment methods named `mock_*` are demonstrations and never represent a captured payment.
- The reset/verification endpoints intentionally return tokens only in development. Connect a self-hosted SMTP relay before inviting customers.
- The in-process rate limiter is suitable for one API replica. Multiple replicas require a shared, self-hosted limiter such as Redis.
- A real launch also requires privacy, terms, returns, shipping, tax and consumer-support policies reviewed by the responsible adult/business owner.

## Main API routes

| Area | Routes |
|---|---|
| Health | `GET /health`, `GET /ready` |
| Auth | `POST /v1/auth/register`, `login`, `logout`, `verify-email`, `forgot-password`, `reset-password`; `GET /v1/auth/me` |
| Catalog | `GET /v1/products`, `GET /v1/products/:id` |
| Cart | `GET /v1/cart`, `PUT /v1/cart/:productId` |
| Wishlist | `GET /v1/wishlist`, `PUT /v1/wishlist/:productId` |
| Addresses | `GET/POST /v1/addresses`, `DELETE /v1/addresses/:id` |
| Checkout | `POST /v1/checkout/quote`, `POST /v1/orders` |
| Orders | `GET /v1/orders`, `GET /v1/orders/:id`, `POST /v1/orders/:id/cancel` |
| Admin | `GET /v1/admin/orders`, `PATCH /v1/admin/orders/:id/status`, `POST /v1/admin/products` |

## Commands

```bash
npm test
npm run migrate
npm run seed
npm start
```
