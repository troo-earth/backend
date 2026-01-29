# troo.earth Backend – Marketplace & Trading Engine

A production-grade backend powering a **carbon credit marketplace**, including **listings, trading, transfers, retirements, audit trails, and session-based authentication**.

---

## 1. Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Runtime      | Node.js (v22)                             |
| Framework    | Express                                   |
| Database     | PostgreSQL (Supabase)                     |
| ORM          | Sequelize                                 |
| Sessions     | Redis (Upstash in prod)                   |
| Auth         | Cookie-based sessions (`express-session`) |
| Payments     | Stripe (PaymentIntent + webhook)          |
| Storage      | Supabase Storage (signed uploads)         |
| Logging      | Custom request tracing + service logging  |
| Architecture | Feature-based modular design              |

---

## 2. High-Level Architecture

```
Client (Web / Admin)
   ↓
Express API
   ↓
Session Middleware (Redis)
   ↓
Auth Middleware
   ↓
Controllers (validation + response)
   ↓
Services (business logic)
   ↓
Sequelize (Postgres)
```

All **credit-affecting operations are transactional** and **audited**.

---

## 3. Folder Structure

```
src/
 ├─ config/
 │   ├─ database.js        # Sequelize instance
 │   ├─ redis.js           # Redis client
 │   ├─ session.js         # express-session + RedisStore
 │   └─ supabase.js        # Supabase client
 │
 ├─ middleware/
 │   ├─ authMiddleware.js  # Requires authenticated session
 │   ├─ responseFormatter.js
 │   ├─ errorHandler.js
 │   ├─ routeLogger.js
 │   └─ tracingMiddleware.js
 │
 ├─ modules/
 │   ├─ auth/
 │   ├─ user/
 │   ├─ org/
 │   ├─ holdings/
 │   ├─ listing/
 │   ├─ listingEvents/
 │   ├─ trading/           # buy / sell / transfer / retire
 │   ├─ transactions/
 │   └─ retirements/
 │
 └─ server.js
```

Each module follows:

```
model → service → controller → routes
```

---

## 4. Global Middleware Order (Critical)

```js
app.set('trust proxy', 1);

app.use(sessionMiddleware);
app.use(responseFormatter);
app.use(tracingMiddleware);
app.use(globalRouteLogger);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Public
app.use('/api/v1/auth', authRoutes);

// Protected
app.use(authMiddleware);
```

---

## 5. Response Format (Strictly Enforced)

### Success

```json
{
  "status": "success",
  "message": "string",
  "data": {},
  "metadata": {}
}
```

### Error

```json
{
  "status": "error",
  "error": {
    "message": "string",
    "statusCode": 400,
    "details": {}
  }
}
```

Controllers **never** send raw JSON or throw responses directly.

---

## 6. Authentication & Sessions

* Cookie-based auth (`troo.sid`)
* Sessions stored in Redis
* Session created on:

  * User signup
  * User login
* Session regenerated on login
* Logout destroys Redis session

### Session Payload

```js
req.session.user = {
  user_id,
  email,
  fullname,
  org_id
}
```

---

## 7. Core Domain Models

### User

| Field         | Notes             |
| ------------- | ----------------- |
| user_id       | UUID              |
| email         | unique            |
| password_hash | bcrypt            |
| fullname      |                   |
| org_id        | nullable FK → Org |

---

### Org

Represents companies/entities.

| Field                                |
| ------------------------------------ |
| org_id (UUID)                        |
| org_code (UNIQUE, public identifier) |
| org_name                             |
| country_code                         |
| registration_id                      |
| logo_url                             |
| incorporation_doc_url                |

`org_code` is used for **transfers instead of exposing UUIDs**.

---

### Holdings

Represents owned credits per org & project.

| Field           |
| --------------- |
| org_id          |
| project_id      |
| credit_balance  |
| locked_for_sale |

Derived:

```
available = credit_balance - locked_for_sale
```

---

### Listings

Marketplace sell offers.

| Field                              |
| ---------------------------------- |
| listing_id                         |
| project_id                         |
| seller_id (nullable → registry)    |
| credits_available                  |
| price_per_credit                   |
| status (open / closed / cancelled) |
| denormalized project metadata      |

---

### ListingEvents (Audit Log)

Append-only, read-only history of listing lifecycle.

**Event Types**

```
CREATED
UPDATED
PARTIALLY_FILLED
FILLED
CLOSED
CANCELLED
```

| Field                                       |
| ------------------------------------------- |
| listing_id                                  |
| event_type                                  |
| actor_org_code (nullable → system/registry) |
| event_data (JSON)                           |
| created_at                                  |

---

### Transactions (Ledger)

Tracks credit movement.

| Field                                 |
| ------------------------------------- |
| type (buy / sell / transfer / retire) |
| from_org_id                           |
| to_org_id                             |
| project_id                            |
| amount                                |
| related_listing_id                    |

---

### RetirementCertificate

Proof of retired credits.

| Field              |
| ------------------ |
| certificate_id     |
| org_id             |
| project_id         |
| amount             |
| purpose            |
| beneficiary        |
| certificate_number |
| transaction_id     |

---

## 8. Trading Flows

### Sell Credits

* Locks credits in holdings
* Creates or merges open listing
* Emits:

  * `CREATED`
  * `UPDATED`

---

### Edit Listing

* Only seller org
* Only open listings
* Delta-based quantity adjustment
* Emits:

  * `UPDATED`

---

### Cancel Listing

* Unlocks remaining credits
* Sets listing → `cancelled`
* Emits:

  * `CANCELLED`

---

### Buy Credits (Finalized after Stripe webhook)

Transactional steps:

1. Lock listing
2. Reduce credits
3. Update status
4. Reduce seller holdings
5. Increase buyer holdings
6. Create `Transactions`
7. Emit:

   * `PARTIALLY_FILLED` or `FILLED`
   * `CLOSED` (system event)

---

### Transfer Credits

* Sender org from session
* Receiver resolved via `org_code`
* Adjust holdings
* Create transaction record

---

### Retire Credits

* Burns credits
* Creates ledger entry
* Issues retirement certificate

---

## 9. Supabase Storage

Buckets:

* `org-logos` (public)
* `org-docs` (private or public)

Flow:

1. Backend generates signed upload URL
2. Frontend uploads file directly
3. Backend stores final URL

---

## 10. Design Principles

* Feature-based modules
* Strong transactional integrity
* Event-driven auditability
* Clear controller/service separation
* No implicit side effects
* Append-only history

---

## 11. Known Future Work

* RBAC (roles & permissions)
* Listing history read APIs (timeline)
* Expiry-based listing closure
* Admin moderation & analytics

---

## 12. Environment Variables (Key)

```
DATABASE_URL
REDIS_URL
SESSION_SECRET
STRIPE_SECRET_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
And More
```

---

## 13. Status

✅ Core marketplace logic complete
✅ Trading + audit events complete
✅ Sessions stable in Redis
🟡 RBAC & analytics pending

---
