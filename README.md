# Bite Express — Order Management Feature (MERN)

A full-stack Order Management feature for a food delivery app: browse the menu, build a cart, check out, and track your order status in **real time**.

Built with **MongoDB (Mongoose, with an in-memory fallback), Express, React (Vite), Node.js**, and **Socket.IO** for live updates.

---

## 1. Architecture

```
mern-order-management/
├── server/                  # Express REST API
│   └── src/
│       ├── config/db.js         # Mongo connection OR in-memory fallback
│       ├── models/              # Mongoose schemas (MenuItem, Order)
│       ├── repositories/        # Data-access layer — hides Mongo vs. in-memory
│       ├── services/            # Business logic (pricing, status simulation)
│       ├── controllers/         # Thin HTTP handlers
│       ├── routes/              # Express routers
│       ├── middleware/          # Validation + centralized error handling
│       └── socket.js            # Socket.IO room-based order subscriptions
│   └── tests/                   # Jest + Supertest (25 tests)
│
└── client/                  # React (Vite) SPA
    └── src/
        ├── api/api.js            # Thin fetch wrapper around the REST API
        ├── context/CartContext.jsx  # Cart state via useReducer
        ├── hooks/useSocket.js       # Subscribes to live order status
        ├── components/              # MenuList, Cart, Checkout, OrderTracker...
        └── tests/                   # Vitest + React Testing Library (15 tests)
```

### Key design decisions

- **Repository pattern on the backend.** Controllers → Services → Repositories.
  Repositories expose the same CRUD interface whether the data lives in
  MongoDB or an in-memory array. This means:
  - The app runs instantly with **zero setup** (no MongoDB required) for
    local dev, demos, and grading.
  - Set `MONGO_URI` in `.env` and it transparently switches to real MongoDB
    (e.g. MongoDB Atlas) in production — no code changes.
  - Tests run fast and deterministically against the in-memory driver.

- **Server-side price calculation.** The client only ever sends
  `menuItemId` + `quantity`. The server looks up the real price and
  snapshots `name`/`price` onto the order line, so historical orders stay
  accurate even if menu prices change later, and prices can never be
  tampered with client-side.

- **Real-time status via Socket.IO, with a polling fallback.** When an
  order is placed, the backend "simulates" a kitchen/delivery pipeline
  (`Order Received → Preparing → Out for Delivery → Delivered`) using
  timers, and broadcasts each change to a per-order Socket.IO room. The
  frontend also polls every 5s as a safety net in case the socket drops.

- **Centralized validation & error handling.** All input validation lives
  in `middleware/validators.js`; all errors funnel through a single
  `errorHandler` so API responses have a consistent shape
  (`{ message, errors? }`).

---

## 2. Getting started locally

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev        # starts on http://localhost:5000
```

Leave `MONGO_URI` empty in `.env` to use the built-in in-memory store, or
paste in a MongoDB Atlas connection string to use real MongoDB.

> **Important:** the in-memory store resets whenever the server restarts
> (which happens on most free hosting tiers). If you want your "recent
> orders" to actually persist, set up a free MongoDB Atlas cluster:
>
> 1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → sign up (free) → create a free (M0) cluster.
> 2. **Database Access** → add a database user with a username/password.
> 3. **Network Access** → add IP `0.0.0.0/0` (allow access from anywhere — fine for this assessment).
> 4. **Connect** → "Drivers" → copy the connection string, e.g.
>    `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/order-management?retryWrites=true&w=majority`
> 5. Paste it into `server/.env` as `MONGO_URI=...` and restart the server.
>    You'll see `[db] Connected to MongoDB.` in the logs instead of the
>    in-memory fallback message — orders and menu items now persist across
>    restarts, and you can inspect them directly in Atlas's Collections view.

### Frontend

```bash
cd client
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm install
npm run dev             # starts on http://localhost:5173
```

Open `http://localhost:5173` — the app will fetch the seeded menu, let you
build a cart, check out, and watch the order status update live.

---

## 3. Testing (TDD)

**Backend** — 25 tests covering CRUD on menu items and orders, input
validation (missing fields, invalid phone numbers, non-existent menu
items, invalid quantities), and status-update transitions:

```bash
cd server
npm test
```

**Frontend** — 15 tests covering cart logic (add/merge/update/remove),
the menu item quantity stepper and add-to-cart flow, and checkout form
validation + submission (including API error handling):

```bash
cd client
npm test
```

---

## 4. API Reference

| Method | Endpoint                    | Description                          |
|--------|------------------------------|---------------------------------------|
| GET    | `/api/menu`                  | List all menu items                   |
| GET    | `/api/menu/:id`               | Get one menu item                     |
| POST   | `/api/menu`                   | Create a menu item                    |
| PUT    | `/api/menu/:id`               | Update a menu item                    |
| DELETE | `/api/menu/:id`               | Delete a menu item                    |
| POST   | `/api/orders`                 | Place an order                        |
| GET    | `/api/orders?phone=`          | List orders (optional phone filter)   |
| GET    | `/api/orders/:id`             | Get one order                         |
| PATCH  | `/api/orders/:id/status`      | Update order status                   |
| DELETE | `/api/orders/:id`             | Cancel an order                       |

**Place an order — request body:**
```json
{
  "items": [{ "menuItemId": "abc123", "quantity": 2 }],
  "customer": { "name": "Jane Doe", "address": "123 Main St", "phone": "555-123-4567" }
}
```

**Socket.IO events:**
- Client emits `order:subscribe` with an order id to join that order's room.
- Server emits `order:status` with `{ orderId, status, updatedAt }` on every transition.

---

## 5. Deployment

**Backend → Render (or Railway):**
1. Push this repo to GitHub.
2. New Web Service → root directory `server` → build command `npm install` → start command `npm start`.
3. Set env vars: `MONGO_URI` (MongoDB Atlas URI), `CLIENT_ORIGIN` (your Vercel URL).

**Frontend → Vercel:**
1. New Project → root directory `client` → framework preset "Vite".
2. Set env var `VITE_API_URL` to your deployed backend URL.
3. Deploy.

---

## 6. Notes for the Loom walkthrough

Suggested flow when recording (12–15 min):
1. **Problem breakdown** — menu → cart → checkout → order → real-time status,
   mapped to REST endpoints + UI views before writing code.
2. **Architecture tour** — repository pattern (Mongo/in-memory swap),
   services vs. controllers, why price is computed server-side.
3. **TDD walkthrough** — show a couple of tests (e.g. invalid phone number,
   order status transition) and the code that satisfies them.
4. **Real-time updates** — show the status simulator + Socket.IO rooms,
   then demo an order live-updating in the browser without a refresh.
5. **AI usage** — this project was scaffolded and iterated with an AI
   pair-programmer (Claude): generating boilerplate (models, routes,
   repository/service layers), writing the initial test suites, and
   catching a real bug during development — an infinite render loop in a
   test helper component that called `addItem()` directly in the render
   body instead of inside `useEffect`, which hung the entire Vitest run.
   Isolating it by running test files one at a time (bisection) found the
   culprit in minutes.
6. **Challenges** — e.g. designing the Mongo/in-memory abstraction so the
   app is gradeable without requiring a database, keeping order line items
   immutable snapshots, and making sure validation errors are consistent
   between client and server.

---

## 7. Evaluation criteria checklist

- ✅ Menu display with name/description/price/image
- ✅ Cart with quantities, checkout with delivery details
- ✅ Order status with simulated real-time updates (Socket.IO)
- ✅ REST API for menu + orders, in-memory or real MongoDB storage
- ✅ "My Orders" screen — looks up recent orders by phone number
  (`GET /api/orders?phone=`), persists the customer's phone in
  `localStorage` so it auto-loads next visit
- ✅ TDD: 25 backend tests + 19 frontend tests, all passing
- ✅ React (Vite) UI, clean and functional
- ✅ Input validation & edge cases (bad phone, missing fields, invalid
  quantities, non-existent menu items, invalid status transitions)
