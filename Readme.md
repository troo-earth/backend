# troo.earth-backend

The backend API server for the **Troo Earth Carbon Credit Marketplace**. This system enables organizations to list, buy, sell, transfer, and retire carbon credits. It provides session-based authentication, transactional trading logic, audit trails, and integrations with Stripe for payments and Supabase for storage.

---

## System Overview

### Business Domain

The marketplace connects **Organizations** that want to offset their carbon footprint with **Carbon Credit Projects**. Key actors:

- **Users**: Authenticate and operate on behalf of an organization.
- **Organizations (Orgs)**: Companies that own, trade, and retire credits.
- **Projects (IcrProject)**: Carbon offset initiatives from which credits originate.
- **Listings**: Sell offers posted in the marketplace.
- **Holdings**: Credit balances per org/project.
- **Transactions**: Immutable ledger of all credit movements.
- **Retirement Certificates**: Proof of credit retirement.

### Architecture

- **Express.js monolith** with feature/module-based structure under `src/modules/`.
- **Layers**: Routes → Controllers → Services → Models (Sequelize + PostgreSQL).
- **Controllers**: HTTP-level (request/response handling, input validation).
- **Services**: Business logic and database access.
- **Models**: Sequelize schema definitions.

### Runtime Components

| Component | Technology |
|-----------|------------|
| HTTP API Server | Node.js + Express.js |
| Database | PostgreSQL (Supabase) via Sequelize |
| Session Store | Redis (via connect-redis) |
| Payment Processing | Stripe (webhooks) |
| Object Storage | Supabase Storage |
| Email | Sendinblue (Brevo) |

---

## Code Structure

### Top-Level Structure

```
src/
├── server.js           # Entrypoint: creates app, mounts middleware & routers
├── config/             # Database, Redis, Session, Supabase configuration
├── middleware/         # Global middlewares (auth, error, logging, tracing)
├── modules/            # Feature modules
└── utils/              # Helper utilities (logger, validation, health, stripe-webhook)
```

### `server.js` Entrypoint

1. Loads environment variables (`dotenv`).
2. Creates Express app instance.
3. Registers Stripe webhook handler (before `express.json()`).
4. Applies global middleware in order:
   - Health tracking → JSON parsing → CORS → Session → Response formatter → Tracing → Route logger → User attachment
5. Mounts module routers:
   - **Public routes** (before auth): `/api/v1/auth`, `/api/v1/users`, `/api/v1/trading`
   - **Auth middleware barrier**: `authMiddleware`
   - **Protected routes** (after auth): `/api/v1/orgs`, `/api/v1/marketplace`, `/api/v1/listings`, `/api/v1/holdings`, `/api/v1/uploads`, `/api/v1/transactions`, `/api/v1/retirements`
6. Applies global error handler.
7. Starts HTTP server (local dev) or exports app (Vercel).

---

## Module Reference

### Auth Module (`src/modules/auth/`)

| File | Purpose |
|------|---------|
| `authRoutes.js` | Route definitions |
| `authController.js` | HTTP handlers |
| `authService.js` | Authentication logic |

**Routes:**
- `POST /api/v1/auth/login` → `loginUserController`
- `GET /api/v1/auth/me` → `verifyUserController`
- `DELETE /api/v1/auth/logout` → `logoutUserController`

---

### User Module (`src/modules/user/`)

| File | Purpose |
|------|---------|
| `userRoutes.js` | Route definitions |
| `userController.js` | HTTP handlers |
| `userService.js` | User CRUD logic |
| `userModel.js` | Sequelize model |

**Routes:**
- `POST /api/v1/users/create-user` → `createUserController`
- `PUT /api/v1/users/update-user/:id` → `updateUserController`
- `GET /api/v1/users/view-user/:id` → `viewUserController`

---

### Org Module (`src/modules/org/`)

| File | Purpose |
|------|---------|
| `orgRoutes.js` | Route definitions |
| `orgController.js` | HTTP handlers |
| `orgService.js` | Organization CRUD logic |
| `orgModel.js` | Sequelize model |

**Routes:**
- `POST /api/v1/orgs/create-org` → `createOrgController`
- `GET /api/v1/orgs/view-org` → `getOrgByIdController`
- `PATCH /api/v1/orgs/update-org/:id` → `updateOrgController`

---

### Listing Module (`src/modules/listing/`)

| File | Purpose |
|------|---------|
| `listingRoutes.js` | Route definitions |
| `listingController.js` | HTTP handlers |
| `listingService.js` | Listing CRUD + event logging |
| `listingModel.js` | Sequelize model |

**Routes:**
- `POST /create-listing` → `createListingController`
- `GET /get-all-listings` → `getAllListingsController`
- `GET /get-org-listings` → `getOrgListingsController`
- `GET /get-listing/:listing_id` → `getListingByIdController`
- `GET /get-all-active-listings` → `getAllActiveListingsController`
- `GET /get-all-closed-listings` → `getAllClosedListingsController`
- `GET /get-org-active-listings` → `getOrgActiveListingsController`
- `GET /get-org-closed-listings` → `getOrgClosedListingsController`
- `PUT /edit-listing` → `editListingController`
- `POST /cancel-listing` → `cancelListingController`

---

### Trading Module (`src/modules/trading/`)

| File | Purpose |
|------|---------|
| `tradingRoutes.js` | Route definitions |
| `tradingController.js` | HTTP handlers |
| `tradingService.js` | Core trading logic (buy, sell, transfer, retire) |

**Routes:**
- `POST /api/v1/trading/buy-credits` → `buyCreditsController`
- `POST /api/v1/trading/sell-credits` → `sellCreditsController`
- `POST /api/v1/trading/transfer-credits` → `transferCreditsController`
- `POST /api/v1/trading/retire-credits` → `retireCreditsController`

---

### Holdings Module (`src/modules/holdings/`)

| File | Purpose |
|------|---------|
| `holdingsRoutes.js` | Route definitions |
| `holdingsController.js` | HTTP handlers |
| `holdingsService.js` | Holdings query logic |
| `holdingsModel.js` | Sequelize model |

**Routes:**
- `GET /api/v1/holdings/view-holdings/:org_id` → `viewHoldingController`

---

### Transactions Module (`src/modules/transactions/`)

| File | Purpose |
|------|---------|
| `transactionsRoutes.js` | Route definitions |
| `transactionsController.js` | HTTP handlers |
| `transactionsService.js` | Transaction query logic |
| `transactionsModel.js` | Sequelize model |

**Routes:**
- `GET /api/v1/transactions/get-transactions` → `viewTransactionsController`

---

### Marketplace Module (`src/modules/marketplace/`)

| File | Purpose |
|------|---------|
| `marketplaceRoutes.js` | Route definitions |
| `marketplaceController.js` | HTTP handlers |
| `marketplaceService.js` | Project query/sync logic |
| `models/icrProjects.js` | Sequelize model |

**Routes:**
- `GET /api/v1/marketplace/projects` → `getAllProjects`
- `GET /api/v1/marketplace/projects/:id` → `getProjectById`
- `POST /api/v1/marketplace/admin-sync` → `syncIcrProjects`

---

### Uploads Module (`src/modules/uploads/`)

| File | Purpose |
|------|---------|
| `uploadRoutes.js` | Route definitions |
| `uploadController.js` | HTTP handlers |
| `uploadService.js` | Supabase signed URL generation |

**Routes:**
- `POST /api/v1/uploads/org-logo` → `uploadOrgLogoController`
- `POST /api/v1/uploads/org-doc` → `uploadOrgDocController`

---

### Retirements Module (`src/modules/reitrements/`)

| File | Purpose |
|------|---------|
| `retirementRoutes.js` | Route definitions |
| `retirementController.js` | HTTP handlers |
| `retirementService.js` | Retirement query logic |
| `retirementCertificateModel.js` | Sequelize model |

**Routes:**
- `GET /api/v1/retirements/view-org` → `viewOrgRetirementController`
- `POST /api/v1/retirements/view-one` → `viewOneRetirementController`

---

### Payments Module (`src/modules/payments/`)

| File | Purpose |
|------|---------|
| `paymentsModel.js` | Sequelize model for payment records |

*No routes/controllers—created via Stripe webhook processing.*

---

### ListingEvents Module (`src/modules/listingEvents/`)

| File | Purpose |
|------|---------|
| `listingEventsModel.js` | Sequelize model |
| `listingEventsService.js` | Event creation logic |

*Internal service—called by trading/listing services, no HTTP routes.*

---

### Emails Module (`src/modules/emails/`)

| File | Purpose |
|------|---------|
| `emailService.js` | Sendinblue email sending |
| `emailTemplates.js` | HTML email templates |
| `emailLayout.js` | Shared email layout |

*Internal service—called by user service, no HTTP routes.*

---

### Integrations Module (`src/modules/integrations/`)

| File | Purpose |
|------|---------|
| `index.js` | Integration exports |
| `icr/` | ICR (registry) API client |
| `utils/` | HTTP utilities |

*Internal service—called by marketplace service, no HTTP routes.*

---

## Controllers and Services: Inputs and Outputs

### Auth Module Controllers

#### Controller: `loginUserController`
- **File**: `src/modules/auth/authController.js`
- **Route**: `POST /api/v1/auth/login`
- **Inputs**:
  | Field | Type | Required | Description |
  |-------|------|----------|-------------|
  | `email` | string | Yes | User email |
  | `password` | string | Yes | User password |
- **Calls Service**: `loginUserService({ email, password })`
- **Success Response**:
  - **Status**: `200`
  - **Body**:
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "data": {
        "user": {
          "user_id": "uuid",
          "fullname": "string",
          "email": "string",
          "role": "string|null",
          "org_id": "uuid|null"
        }
      }
    }
    ```
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Email and password are required |
  | 401 | Invalid email or password |
  | 500 | Internal error |

---

#### Controller: `verifyUserController`
- **File**: `src/modules/auth/authController.js`
- **Route**: `GET /api/v1/auth/me`
- **Inputs**: None (uses session)
- **Calls Service**: `verifyUserService(req.session.user)`
- **Success Response**:
  - **Status**: `200`
  - **Body**:
    ```json
    {
      "status": "success",
      "message": "Authenticated",
      "data": {
        "user": { "user_id", "email", "fullname", "role", "org_id" }
      }
    }
    ```
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 401 | Not authenticated |

---

#### Controller: `logoutUserController`
- **File**: `src/modules/auth/authController.js`
- **Route**: `DELETE /api/v1/auth/logout`
- **Inputs**: None
- **Calls Service**: `logoutUserService()` (no-op)
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ "status": "success", "message": "Logged out successfully" }`
- **Side Effects**: Destroys session, clears `troo.sid` cookie.

---

### Auth Module Services

#### Service: `loginUserService`
- **File**: `src/modules/auth/authService.js`
- **Called By**: `loginUserController`
- **Inputs**:
  | Param | Type | Description |
  |-------|------|-------------|
  | `email` | string | User email |
  | `password` | string | User password |
- **Behavior**:
  1. Validates email/password presence.
  2. Queries `User.findOne({ where: { email } })`.
  3. Compares password with stored hash via `bcrypt.compare()`.
- **Returns**: User object on success.
- **Errors**:
  - `Email and password are required`
  - `Invalid email or password`

---

#### Service: `verifyUserService`
- **File**: `src/modules/auth/authService.js`
- **Called By**: `verifyUserController`
- **Inputs**: `sessionUser` (object from `req.session.user`)
- **Behavior**: Validates session user object exists.
- **Returns**: `{ user_id, email, fullname, role, org_id }`
- **Errors**: `Not authenticated`

---

#### Service: `logoutUserService`
- **File**: `src/modules/auth/authService.js`
- **Called By**: `logoutUserController`
- **Inputs**: None
- **Behavior**: No-op (session destruction handled in controller).
- **Returns**: `true`

---

### User Module Controllers

#### Controller: `createUserController`
- **File**: `src/modules/user/userController.js`
- **Route**: `POST /api/v1/users/create-user`
- **Inputs**:
  | Field | Type | Required | Constraints |
  |-------|------|----------|-------------|
  | `user_name` | string | Yes | Non-empty |
  | `email` | string | Yes | Valid email format |
  | `password` | string | Yes | Min 8 chars, letter+number+special |
  | `fullname` | string | Yes | Letters, spaces, hyphens only |
- **Calls Service**: `createUserService({ user_name, email, password, fullname })`
- **Success Response**:
  - **Status**: `201`
  - **Body**: `{ success: true, message: "User created successfully", data: { user (without password_hash) } }`
  - **Side Effect**: Creates session with new user.
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Missing required fields |
  | 400 | Invalid email format |
  | 400 | Invalid password format |
  | 400 | Full name is required... |
  | 400 | Full name contains invalid characters |
  | 409 | Email already registered |
  | 409 | Username already registered |

---

#### Controller: `updateUserController`
- **File**: `src/modules/user/userController.js`
- **Route**: `PUT /api/v1/users/update-user/:id`
- **Inputs**:
  | Source | Field | Type | Required |
  |--------|-------|------|----------|
  | Param | `id` | UUID | Yes |
  | Body | `user_name` | string | No |
  | Body | `email` | string | No |
  | Body | `password` | string | No |
  | Body | `fullname` | string | No |
  | Body | `org_id` | UUID | No |
- **Calls Service**: `updateUserService(user_id, updateFields)`
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ success: true, message: "User updated successfully", data: { user } }`
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Invalid user ID format |
  | 400 | Missing update fields |
  | 400 | No valid update fields provided |
  | 400 | Invalid email/password/org_id format |
  | 404 | User not found |
  | 409 | Email/Username already registered |

---

#### Controller: `viewUserController`
- **File**: `src/modules/user/userController.js`
- **Route**: `GET /api/v1/users/view-user/:id`
- **Inputs**:
  | Source | Field | Type | Required |
  |--------|-------|------|----------|
  | Param | `id` | UUID | Yes |
- **Calls Service**: `viewUserService(user_id)`
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ success: true, message: "User found", data: { user } }`
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Missing user ID |
  | 404 | User not found |

---

### User Module Services

#### Service: `createUserService`
- **File**: `src/modules/user/userService.js`
- **Called By**: `createUserController`
- **Inputs**:
  | Param | Type |
  |-------|------|
  | `user_name` | string |
  | `email` | string |
  | `password` | string |
  | `fullname` | string |
- **Behavior**:
  1. Validates all inputs (format, constraints).
  2. Normalizes email (lowercase), fullname (title case).
  3. Checks uniqueness (email, username).
  4. Hashes password with bcrypt (10 rounds).
  5. Creates user in DB.
  6. Sends welcome email (non-blocking).
- **Returns**: Created User object.
- **Errors**: Multiple validation/uniqueness errors.

---

#### Service: `updateUserService`
- **File**: `src/modules/user/userService.js`
- **Called By**: `updateUserController`
- **Inputs**: `user_id` (UUID), `updateFields` (object)
- **Allowed Fields**: `user_name`, `email`, `password`, `fullname`, `org_id`
- **Behavior**:
  1. Validates allowed fields only.
  2. Re-hashes password if provided.
  3. Updates user in DB.
  4. Sends update notification email (non-blocking).
- **Returns**: Updated User object.
- **Errors**: Validation, not found errors.

---

#### Service: `viewUserService`
- **File**: `src/modules/user/userService.js`
- **Called By**: `viewUserController`
- **Inputs**: `user_id` (UUID)
- **Behavior**: `User.findByPk(user_id)`
- **Returns**: User object.
- **Errors**: `Missing user ID`, `User not found`

---

### Org Module Controllers

#### Controller: `createOrgController`
- **File**: `src/modules/org/orgController.js`
- **Route**: `POST /api/v1/orgs/create-org`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `org_name` | string | Yes |
  | `country_code` | string (2 chars) | Yes |
  | `registration_id` | string | No |
  | `logo_url` | string | No |
  | `incorporation_doc_url` | string | No |
- **Calls Service**: `createOrgService(req.body, req.session.user)`
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ status: "success", message: "Organization created successfully", data: { org } }`
  - **Side Effect**: Updates session with new `org_id`.
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | org_name and country_code are required |
  | 401 | Unauthenticated |

---

#### Controller: `getOrgByIdController`
- **File**: `src/modules/org/orgController.js`
- **Route**: `GET /api/v1/orgs/view-org`
- **Inputs**: None (uses `req.session.user.org_id`)
- **Calls Service**: `getOrgByIdService(org_id)`
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ status: "success", data: { org_id, org_name, org_code, ..., employees: [...] } }`
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 403 | User is not associated with any organization |
  | 404 | Org not found |

---

#### Controller: `updateOrgController`
- **File**: `src/modules/org/orgController.js`
- **Route**: `PATCH /api/v1/orgs/update-org/:id`
- **Inputs**:
  | Source | Field | Type | Required |
  |--------|-------|------|----------|
  | Param | `id` | UUID | Yes |
  | Body | `org_name` | string | No |
  | Body | `country_code` | string | No |
  | Body | `registration_id` | string | No |
  | Body | `logo_url` | string | No |
  | Body | `incorporation_doc_url` | string | No |
- **Calls Service**: `updateOrgService(org_id, updateFields)`
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ status: "success", data: { org } }`
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Missing org_id / No update fields / No valid fields |
  | 404 | Org not found |

---

### Org Module Services

#### Service: `createOrgService`
- **File**: `src/modules/org/orgService.js`
- **Called By**: `createOrgController`
- **Inputs**: `payload` (org fields), `sessionUser`
- **Behavior**:
  1. Generates UUID for `org_id`.
  2. Generates `org_code` from name + id.
  3. Creates org in DB.
  4. Updates creator user with `org_id`.
- **Returns**: Created Org object.
- **Errors**: `org_name and country_code are required`, `Unauthenticated`

---

#### Service: `getOrgByIdService`
- **File**: `src/modules/org/orgService.js`
- **Called By**: `getOrgByIdController`
- **Inputs**: `org_id` (UUID)
- **Behavior**:
  1. Fetches org by ID.
  2. Fetches all users with this `org_id`.
- **Returns**: `{ ...org, employees: [...] }`
- **Errors**: `Missing org_id`, `Org not found`

---

#### Service: `updateOrgService`
- **File**: `src/modules/org/orgService.js`
- **Called By**: `updateOrgController`
- **Inputs**: `org_id` (UUID), `updateFields` (object)
- **Allowed Fields**: `org_name`, `country_code`, `registration_id`, `logo_url`, `incorporation_doc_url`
- **Behavior**: Filters to allowed fields, updates org.
- **Returns**: Updated Org object.
- **Errors**: `Missing org_id`, `No update fields provided`, `No valid fields to update`, `Org not found`

---

### Listing Module Controllers

#### Controller: `createListingController`
- **File**: `src/modules/listing/listingController.js`
- **Route**: `POST /api/v1/listings/create-listing`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `project_id` | UUID | Yes |
  | `credits_available` | number | Yes |
  | `price_per_credit` | number | Yes |
  | `project_name` | string | Yes |
  | `project_start_year` | number | Yes |
  | `registry` | string | Yes |
  | `category` | string | Yes |
  | `location_city` | string | Yes |
  | `location_state` | string | Yes |
  | `location_country` | string | Yes |
  | `thumbnail_url` | string | Yes |
  | `methodology` | string | Yes |
- **Calls Service**: `createListingService(listingData)`
- **Success Response**: `201` with listing object.
- **Error Responses**: `400` for missing fields, `500` for failures.

---

#### Controller: `getAllListingsController`
- **Route**: `GET /api/v1/listings/get-all-listings`
- **Inputs**: None
- **Returns**: Array of all listings.

---

#### Controller: `getOrgListingsController`
- **Route**: `GET /api/v1/listings/get-org-listings`
- **Inputs**: Uses `req.session.user.org_id`
- **Returns**: Array of listings for user's org.
- **Error**: `403` if no org linked.

---

#### Controller: `getListingByIdController`
- **Route**: `GET /api/v1/listings/get-listing/:listing_id`
- **Inputs**: `listing_id` (path param, UUID)
- **Returns**: Listing + project + seller details.
- **Errors**: `400` invalid UUID, `404` not found.

---

#### Controller: `getAllActiveListingsController`
- **Route**: `GET /api/v1/listings/get-all-active-listings`
- **Returns**: All listings with `status = 'open'`.

---

#### Controller: `getAllClosedListingsController`
- **Route**: `GET /api/v1/listings/get-all-closed-listings`
- **Returns**: All listings with `status = 'closed'`.

---

#### Controller: `getOrgActiveListingsController`
- **Route**: `GET /api/v1/listings/get-org-active-listings`
- **Returns**: User's org active listings.

---

#### Controller: `getOrgClosedListingsController`
- **Route**: `GET /api/v1/listings/get-org-closed-listings`
- **Returns**: User's org closed listings.

---

#### Controller: `editListingController`
- **Route**: `PUT /api/v1/listings/edit-listing`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `listing_id` | UUID | Yes |
  | `price` | number | Yes |
  | `quantity` | number | Yes |
- **Calls Service**: `editListingService({ listing_id, org_id, new_price, new_quantity })`
- **Success**: `200` with updated listing.
- **Errors**: `400` (validation), `403` (unauthorized), `404` (not found).

---

#### Controller: `cancelListingController`
- **Route**: `POST /api/v1/listings/cancel-listing`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `listing_id` | UUID | Yes |
- **Calls Service**: `cancelListingService(listing_id, org_id)`
- **Success**: `200` with cancelled listing.
- **Errors**: `400` (invalid UUID), `403` (unauthorized/registry listing), `404` (not found).

---

### Listing Module Services

#### Service: `createListingService`
- **Behavior**: Creates listing + emits `CREATED` event within transaction.
- **Returns**: Created listing.

#### Service: `editListingService`
- **Behavior**:
  1. Validates listing is open and owned by org.
  2. Updates price/quantity.
  3. Adjusts `Holdings.locked_for_sale` for quantity changes.
  4. Emits `UPDATED` event.
- **Returns**: Updated listing.
- **Errors**: `Listing not found`, `Listing is not editable`, `Unauthorized`, `Insufficient credits`, etc.

#### Service: `cancelListingService`
- **Behavior**:
  1. Validates listing is open and org-owned.
  2. Unlocks credits in holdings.
  3. Sets status to `closed`.
  4. Emits `CANCELLED` event.
- **Returns**: Cancelled listing.

---

### Trading Module Controllers

#### Controller: `buyCreditsController`
- **File**: `src/modules/trading/tradingController.js`
- **Route**: `POST /api/v1/trading/buy-credits`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `listing_id` | UUID | Yes |
  | `amount` | number | Yes |
- **Behavior**: Creates Stripe PaymentIntent. Actual credit transfer happens via Stripe webhook.
- **Success Response**:
  - **Status**: `200`
  - **Body**: `{ status: "success", data: { payment_intent_id, client_secret } }`
- **Error Responses**:
  | Status | Message |
  |--------|---------|
  | 400 | Missing required fields / Invalid UUID / Amount must be positive |
  | 404 | Listing not found |
  | 409 | Insufficient credits / Listing not open |

---

#### Controller: `sellCreditsController`
- **Route**: `POST /api/v1/trading/sell-credits`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `project_id` | UUID | Yes |
  | `amount` | number | Yes (positive) |
  | `price` | number | Yes (positive) |
- **Calls Service**: `sellCreditsService(org_id, project_id, amount, price)`
- **Success**: `200` with `{ listing_id, credits_available }`.
- **Errors**: `400` (validation), `403` (no org), `404` (holdings/project not found).

---

#### Controller: `transferCreditsController`
- **Route**: `POST /api/v1/trading/transfer-credits`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `to_org_code` | string | Yes |
  | `project_id` | UUID | Yes |
  | `amount` | number | Yes (positive) |
- **Calls Service**: `transferCreditsService(from_org_id, to_org_code, project_id, amount)`
- **Success**: `200` with `{ transferred, to_org_code }`.
- **Errors**: `400` (same org, insufficient credits), `404` (org/holdings not found).

---

#### Controller: `retireCreditsController`
- **Route**: `POST /api/v1/trading/retire-credits`
- **Inputs**:
  | Field | Type | Required |
  |-------|------|----------|
  | `org_id` | UUID | Yes |
  | `project_id` | UUID | Yes |
  | `amount` | number | Yes (positive) |
  | `purpose` | string | No |
  | `beneficiary` | string | No |
- **Calls Service**: `retireCreditsService(org_id, project_id, amount, purpose, beneficiary)`
- **Success**: `200` with `{ certificate_id, certificate_number, retired_amount }`.
- **Errors**: `400` for all domain errors.

---

### Trading Module Services

#### Service: `buyCreditsService`
- **File**: `src/modules/trading/tradingService.js`
- **Called By**: Stripe webhook handler (`stripe-webhook.js`)
- **Inputs**: `listing_id`, `buyer_org_id`, `amount`, `{ transaction }`
- **Behavior** (within transaction):
  1. Lock listing row, validate status and availability.
  2. Reduce `listing.credits_available`, close if zero.
  3. Reduce seller `Holdings` (locked + balance).
  4. Create/update buyer `Holdings`.
  5. Create `Transactions` record (type='buy').
  6. Emit `PARTIALLY_FILLED`/`FILLED`/`CLOSED` events.
- **Returns**: `{}`
- **Errors**: `Listing not found`, `Listing is not open`, `Insufficient credits`, `Seller holdings not found`.

---

#### Service: `sellCreditsService`
- **Called By**: `sellCreditsController`
- **Inputs**: `org_id`, `project_id`, `amount`, `price`
- **Behavior** (within transaction):
  1. Validate holdings exist and have sufficient balance.
  2. Check for existing open listing at same price → merge if found.
  3. Otherwise create new listing.
  4. Lock credits in holdings.
  5. Emit `CREATED` or `UPDATED` event.
- **Returns**: `{ listing_id, credits_available }`
- **Errors**: `Org not found`, `No holdings found`, `Insufficient credits`, `Project not found`.

---

#### Service: `transferCreditsService`
- **Called By**: `transferCreditsController`
- **Inputs**: `from_org_id`, `to_org_code`, `project_id`, `amount`
- **Behavior** (within transaction):
  1. Resolve target org by `org_code`.
  2. Validate not same org.
  3. Validate sender has sufficient available credits (balance - locked).
  4. Deduct from sender, add to receiver (create holdings if needed).
  5. Create `Transactions` record (type='transfer').
- **Returns**: `{ transferred, to_org_code }`
- **Errors**: `Target organization not found`, `Cannot transfer to same org`, `Insufficient credits`.

---

#### Service: `retireCreditsService`
- **Called By**: `retireCreditsController`
- **Inputs**: `org_id`, `project_id`, `amount`, `purpose`, `beneficiary`
- **Behavior** (within transaction):
  1. Validate holdings and available credits.
  2. Deduct from balance (burn).
  3. Create `Transactions` record (type='retire').
  4. Create `RetirementCertificate`.
- **Returns**: `{ certificate_id, certificate_number, retired_amount }`
- **Errors**: `No holdings found`, `Insufficient available credits`.

---

### Holdings Module

#### Controller: `viewHoldingController`
- **Route**: `GET /api/v1/holdings/view-holdings/:org_id`
- **Inputs**: `org_id` (path param, UUID)
- **Calls Service**: `viewHoldingService(org_id)`
- **Success**: `200` with holdings array.
- **Errors**: `400` (invalid UUID), `404` (org not found).

#### Service: `viewHoldingService`
- **Inputs**: `org_id`
- **Behavior**: Validates org exists, returns all holdings for org.
- **Returns**: `{ data: holdings[] }` or `{ error, statusCode }`.

---

### Transactions Module

#### Controller: `viewTransactionsController`
- **Route**: `GET /api/v1/transactions/get-transactions`
- **Inputs**: Uses `req.session.user.org_id`
- **Calls Service**: `viewTransactionsService(org_id)`
- **Success**: `200` with transactions array.
- **Errors**: `401` if no org in session.

#### Service: `viewTransactionsService`
- **Inputs**: `org_id`
- **Behavior**: Returns all transactions where `from_org_id = org_id OR to_org_id = org_id`.
- **Returns**: `{ data: transactions[] }` or `{ error, statusCode }`.

---

### Marketplace Module

#### Controller: `getAllProjects`
- **Route**: `GET /api/v1/marketplace/projects`
- **Inputs**: `status` (query param, optional)
- **Calls Service**: `marketplaceService.getAllProjects({ status })`
- **Success**: `200` with `{ success: true, data: { projects, total } }`.

#### Controller: `getProjectById`
- **Route**: `GET /api/v1/marketplace/projects/:id`
- **Inputs**: `id` (path param)
- **Calls Service**: `marketplaceService.getProjectById(id)`
- **Success**: `200` with project object.

#### Controller: `syncIcrProjects`
- **Route**: `POST /api/v1/marketplace/admin-sync`
- **Behavior**: Fetches projects from ICR API, upserts validated ones to DB.
- **Success**: `200` with `{ success: true, count }`.

---

### Uploads Module

#### Controller: `uploadOrgLogoController`
- **Route**: `POST /api/v1/uploads/org-logo`
- **Inputs**: `file_name` (body, string, required)
- **Calls Service**: `getSignedUploadUrl({ bucket: 'org-logos', file_name })`
- **Success**: `200` with `{ uploadUrl, publicUrl, path }`.
- **Errors**: `400` if missing file_name.

#### Controller: `uploadOrgDocController`
- **Route**: `POST /api/v1/uploads/org-doc`
- **Inputs**: `file_name` (body, string, required)
- **Calls Service**: `getSignedUploadUrl({ bucket: 'org-docs', file_name })`
- **Success**: `200` with `{ uploadUrl, publicUrl, path }`.

#### Service: `getSignedUploadUrl`
- **Inputs**: `{ bucket, file_name }`
- **Behavior**: Generates signed upload URL via Supabase Storage.
- **Returns**: `{ uploadUrl, publicUrl, path }`.

---

### Retirements Module

#### Controller: `viewOrgRetirementController`
- **Route**: `GET /api/v1/retirements/view-org`
- **Inputs**: Uses `req.session.user.org_id`
- **Calls Service**: `viewOrgRetirementService(org_id)`
- **Success**: `200` with certificates array.
- **Errors**: `401` if missing org_id.

#### Controller: `viewOneRetirementController`
- **Route**: `POST /api/v1/retirements/view-one`
- **Inputs**: `certificate_id` (body, UUID, required)
- **Calls Service**: `viewOneRetirementService(certificate_id)`
- **Success**: `200` with certificate object.
- **Errors**: `400` (missing/invalid UUID), `404` (not found).

---

### Internal Services (No HTTP Routes)

#### `createListingEvent`
- **File**: `src/modules/listingEvents/listingEventsService.js`
- **Called By**: Trading and Listing services.
- **Inputs**: `{ listing_id, event_type, event_data, actor_org_code, transaction }`
- **Behavior**: Creates immutable event record.

#### `sendEmail`
- **File**: `src/modules/emails/emailService.js`
- **Called By**: User service.
- **Inputs**: `{ to, subject, html }`
- **Behavior**: Sends transactional email via Sendinblue.

---

## Data Models and Persistence

### Models Summary

| Model | Table | File | Key Fields |
|-------|-------|------|------------|
| User | Users | `user/userModel.js` | `user_id` (PK), `email`, `password_hash`, `fullname`, `org_id` |
| Org | Orgs | `org/orgModel.js` | `org_id` (PK), `org_name`, `org_code`, `country_code` |
| Listing | Listings | `listing/listingModel.js` | `listing_id` (PK), `project_id`, `seller_id`, `credits_available`, `price_per_credit`, `status` |
| Holdings | Holdings | `holdings/holdingsModel.js` | `holding_id` (PK), `org_id`, `project_id`, `credit_balance`, `locked_for_sale` |
| Transactions | Transactions | `transactions/transactionsModel.js` | `tx_id` (PK), `type`, `from_org_id`, `to_org_id`, `amount` |
| ListingEvents | ListingEvents | `listingEvents/listingEventsModel.js` | `event_id` (PK), `listing_id`, `event_type`, `event_data` |
| RetirementCertificate | RetirementCertificates | `reitrements/retirementCertificateModel.js` | `certificate_id` (PK), `org_id`, `project_id`, `amount`, `certificate_number` |
| IcrProject | icrProjects | `marketplace/models/icrProjects.js` | `id` (PK), `fullName`, `status`, `sector`, `methodology` |
| Payments | Payments | `payments/paymentsModel.js` | `id` (PK), `stripe_payment_intent_id`, `buyer_org_id`, `listing_id` |

### Sequelize Setup

- **Instance**: `src/config/database.js` creates `new Sequelize(url, config)`.
- **Config**: `src/config/config.js` exports environment-specific settings (SSL, pool: max 3).
- **Model Registration**: Each model file imports sequelize and calls `sequelize.define()`.

---

## Cross-Cutting Concerns

### Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| Auth | `authMiddleware.js` | Checks `req.session.user`, returns 401 if missing |
| Error Handler | `errorHandler.js` | Catches errors, formats consistent JSON response |
| Response Formatter | `responseFormatter.js` | Adds `res.success()` and `res.error()` helpers |
| Route Logger | `routeLogger.js` | Logs request entry/exit with duration |
| Tracing | `tracingMiddleware.js` | Assigns `traceId` using `AsyncLocalStorage` |

### Session

- Cookie name: `troo.sid`
- Store: Redis via `connect-redis`
- TTL: 24 hours
- Settings: `httpOnly: true`, `secure` in production

---

## Development

### Scripts

| Command | Action |
|---------|--------|
| `npm start` | Production server |
| `npm run dev` | Development with nodemon |

### Testing

> ⚠️ **No automated tests exist currently.**

Suggested structure:
- `src/modules/<module>/__tests__/<module>.test.js`
- Framework: Jest or Mocha

---

## Conventions and Guidelines

### Layering Rules

```
Routes → Controllers → Services → Models
```

- **Controllers**: HTTP only. Validate input, call service, format response.
- **Services**: Business logic + ALL database access.
- **Models**: Schema definitions only.

> ⚠️ **Controllers must NOT query Models directly.** One legacy exception exists—do not follow it.

### Naming Conventions

- Files: `<feature>Routes.js`, `<feature>Controller.js`, `<feature>Service.js`, `<feature>Model.js`
- Functions: `verbNoun` (e.g., `createUser`, `viewHoldings`)

### Patterns

- Use `async/await` throughout.
- Use `res.success(message, data)` and `res.error(message, status)`.
- Use `sequelize.transaction()` with `t.LOCK.UPDATE` for multi-step operations.
- Wrap controllers/services with `withLogging(fn, 'name')`.

### Known Gotchas

1. **Stripe webhook placement**: Must be before `express.json()` middleware
2. **Legacy controller DB access**: Some controllers query models directly—do not copy
