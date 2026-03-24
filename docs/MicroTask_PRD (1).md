# Product Requirements Document
## Micro-Task & Earning Platform

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Ready for Development |
| Deadline | 25th March 2026 |
| Frontend Stack | React + Mock Data (JWT Auth) |
| Backend Stack | Node.js / Express + MongoDB + JWT |
| Payment | Dummy Payment System |
| Deployment | Not Required |

> **Key Decisions:**
> - No Firebase — use JWT
> - No Stripe — Dummy Payment only
> - Frontend uses Mock Data first, swap with real API later

---

## 1. Platform Overview

A three-role micro-tasking platform where Workers complete tasks to earn coins, Buyers post tasks and pay Workers, and Admins manage the platform. The frontend will be built first using mock/static data. The backend API will be integrated later by replacing mock calls with real fetch/axios calls.

### Roles

| Role | Default Coins | Primary Responsibility |
|---|---|---|
| Worker | 10 coins on registration | Browse tasks, submit work, withdraw earnings |
| Buyer | 50 coins on registration | Post tasks, review submissions, purchase coins |
| Admin | N/A (pre-seeded) | Manage users, tasks, and withdrawal requests |

### Coin Economy

- Buyers purchase coins — **10 coins = $1**
- Workers earn coins per approved task submission
- Workers withdraw — **20 coins = $1** — the spread is the platform's revenue
- Minimum withdrawal threshold: **200 coins ($10)**

---

## 2. Frontend Epics

> Build the entire UI first using mock/static data. Create a `mockData.js` file that exports arrays/objects matching the exact shape the backend API will return. When the backend is ready, swap the mock imports with real API calls.

---

### FE-01 — Project Setup

> Initialize the React project, install dependencies, configure environment variables, and establish the folder structure. No auth logic here — just scaffolding.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Project bootstrapped with Vite (or CRA), TailwindCSS (or chosen CSS library) installed and configured. |
| AC-02 | All required dependencies installed: React Router v6+, axios (or fetch wrapper), a toast/notification library. |
| AC-03 | A `mockData.js` file created with sample data arrays for users, tasks, submissions, withdrawals, notifications, and payments — shaped exactly as the backend will return. |
| AC-04 | Environment variable setup: a `.env` file holds the API base URL (`VITE_API_URL`). All API calls reference this variable, never a hard-coded URL. |
| AC-05 | Folder structure established: `/pages`, `/components`, `/layouts`, `/hooks`, `/context`, `/mock`, `/utils`. |
| AC-06 | Project runs without errors on `npm run dev`. |

---

### FE-02 — Navigation Structure (Navbar & Footer)

> Build the responsive navbar and footer. At this stage the navbar renders the logged-out state only — dynamic logged-in behaviour is wired in FE-04 once auth is in place.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Navbar renders for the not-logged-in state: site logo/name, Login link, Register link. |
| AC-02 | Footer includes the site logo and social media icon links (LinkedIn, GitHub, Facebook). |
| AC-03 | Navbar and footer are responsive across mobile (≤768px), tablet (768–1024px), and desktop (>1024px). |
| AC-04 | A 404 Not Found page exists and is displayed for all unmatched routes. |
| AC-05 | Basic route placeholders exist for `/`, `/login`, `/register`, and `/dashboard` so navigation links resolve without errors. |

---

### FE-03 — Home Page (Public)

> Build the public-facing landing page with all required sections and animations.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Hero section renders a slider/carousel with at least 3 slides, each with a unique heading and subtitle — uses React Responsive Carousel or Swiper. |
| AC-02 | Best Workers section displays the top 6 workers (sorted by coins descending) with avatar and coin count, populated from mock data. |
| AC-03 | Testimonials section displays user feedback in a Swiper slider with name, photo, and quote. Content is static. |
| AC-04 | At least 3 additional custom sections are present with meaningful, non-placeholder content. |
| AC-05 | At least one CSS or JS entrance/scroll animation is applied on the homepage. |
| AC-06 | No lorem ipsum or placeholder text anywhere on the page. |
| AC-07 | Home page is fully responsive. |

---

### FE-04 — Authentication (Context + Routing + UI)

> Everything auth-related is grouped here so it can be tackled together after learning the concepts. This covers: the AuthContext that holds user state, JWT token storage and restoration, protected and role-based routing, the register form, and the login form. Mock data is used throughout — no real API calls yet.
>
> **Concepts covered in this epic:** React Context API, `localStorage`, JWT structure, `PrivateRoute` pattern, role-based access control, controlled form validation.

#### Part A — AuthContext & Token Handling

| ID | Criteria |
|---|---|
| AC-01 | An `AuthContext` is created in `/context/AuthContext.jsx` and wraps the entire app in `main.jsx`. |
| AC-02 | `AuthContext` exposes: `currentUser` (object or null), `loading` (boolean), `login(email, password)`, `register(name, email, photoURL, password, role)`, `logout()`. |
| AC-03 | On `login` (mock): a fake JWT string is stored in `localStorage` under the key `token` and `currentUser` is set from the matching mock user. |
| AC-04 | On `register` (mock): a new user object is added to mock state, a fake JWT is stored in `localStorage`, and `currentUser` is set. |
| AC-05 | On `logout`: the `localStorage` token is removed and `currentUser` is set to `null`. |
| AC-06 | On app load, `AuthContext` reads the token from `localStorage` and restores `currentUser` from mock data if a token is present — this is what prevents the reload-redirect bug. |
| AC-07 | While `loading` is `true` during the initial token check, a full-page spinner is shown so protected routes never flash a redirect before auth state is known. |

#### Part B — Routing & Route Protection

| ID | Criteria |
|---|---|
| AC-08 | React Router v6+ is fully configured: public routes `/`, `/login`, `/register` and protected routes under `/dashboard/*`. |
| AC-09 | A `PrivateRoute` component checks `currentUser`. If null it redirects to `/login`; if present it renders the child route. |
| AC-10 | On reloading any protected route (e.g. `/dashboard/worker-home`), the user stays on that page as long as a token exists in `localStorage` — never incorrectly bounced to `/login`. |
| AC-11 | A `RoleRoute` component (or equivalent) checks `currentUser.role`. If the role does not match the required role for that section, it redirects to the user's own dashboard home. |
| AC-12 | Navbar updates reactively based on `currentUser`: logged-out state shows Login/Register; logged-in state shows Dashboard link, coin count, user avatar, and a logout dropdown. |

#### Part C — Register & Login UI

| ID | Criteria |
|---|---|
| AC-13 | Register page has fields: Full Name, Email, Profile Picture URL, Password, and a Role dropdown (Worker / Buyer). |
| AC-14 | Login page has Email and Password fields plus a Google Sign-In button (UI only for now — wire to real provider in backend integration phase). |
| AC-15 | Client-side validation on both forms: email format is checked, password must be at least 6 characters, inline error messages are shown without a page reload. |
| AC-16 | After successful registration (mock), the user is redirected to `/dashboard`. |
| AC-17 | After successful login (mock), the user is redirected to `/dashboard`. |
| AC-18 | Registering with an already-used email (present in mock data) shows an "Email already in use" error. |
| AC-19 | Logging in with wrong credentials (not matching mock data) shows an "Invalid email or password" error. |

---

### FE-05 — Dashboard Shell & Layout

> Build the reusable dashboard layout used by all three roles. Depends on FE-04 being complete so that `currentUser` and role are available from AuthContext.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Dashboard layout has a sidebar showing role-specific navigation links based on `currentUser.role` from AuthContext. |
| AC-02 | Dashboard header shows: site logo, available coin count, user avatar, user role, username, and a notification bell icon. |
| AC-03 | Sidebar links per role — Worker: Home, Task List, My Submissions, Withdrawals. Buyer: Home, Add Task, My Tasks, Purchase Coin, Payment History. Admin: Home, Manage Users, Manage Tasks. |
| AC-04 | Dashboard layout is responsive; sidebar collapses to a drawer/hamburger menu on mobile. |
| AC-05 | Clicking the notification bell opens a floating popup listing notifications from mock data, sorted newest first. Clicking anywhere outside closes it. |
| AC-06 | Active navigation item is visually highlighted. |
| AC-07 | Dashboard shell renders correctly for all three roles when the mock role is switched. |

---

### FE-06 — Worker Dashboard — All Screens

> Build all screens accessible to the Worker role.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Worker Home shows three stat cards: Total Submissions, Pending Submissions, Total Earnings (in coins) — from mock data. |
| AC-02 | Worker Home shows a table of approved submissions with columns: Task Title, Payable Amount, Buyer Name, Status. |
| AC-03 | Task List page displays available tasks (where `required_workers > 0`) as cards showing: task title, buyer name, completion date, payable amount, required workers, and a View Details button. |
| AC-04 | Task Details page shows all task information and a submission form with a single textarea (`submission_details`). |
| AC-05 | Submitting the form saves to mock state and shows a success toast/alert. |
| AC-06 | My Submissions page shows all submissions by the logged-in worker with status visually highlighted — pending = yellow, approved = green, rejected = red. |
| AC-07 | My Submissions page implements pagination (10 items per page with page controls). |
| AC-08 | Withdrawals page shows: current coin balance, equivalent dollar amount, and a withdrawal form with fields: Coin to Withdraw (number), Withdrawal Amount (auto-calculated read-only, 20 coins = $1), Payment Method dropdown, Account Number. |
| AC-09 | Withdraw button is hidden and replaced with an "Insufficient Coins" message if the worker has fewer than 200 coins. |
| AC-10 | Coin to Withdraw field cannot exceed the worker's current coin balance — validated client-side. |

---

### FE-07 — Buyer Dashboard — All Screens

> Build all screens accessible to the Buyer role.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Buyer Home shows three stat cards: Total Tasks Added, Total Pending Workers (sum of `required_workers` across all tasks), Total Payment Paid. |
| AC-02 | Buyer Home shows a Tasks to Review table with columns: Worker Name, Task Title, Payable Amount, View Submission button, Approve button, Reject button. |
| AC-03 | Clicking View Submission opens a modal displaying the full submission details. |
| AC-04 | Clicking Approve updates submission status to `approved` in mock state and increases the worker's mock coin balance by `payable_amount`. |
| AC-05 | Clicking Reject updates submission status to `rejected` in mock state and increments `required_workers` by 1 for that task. |
| AC-06 | Add New Task form has fields: Task Title, Task Detail, Required Workers (number), Payable Amount per worker (number), Completion Date, Submission Info, Task Image URL. |
| AC-07 | On form submit, total cost (`required_workers × payable_amount`) is calculated. If it exceeds the buyer's coin balance, an alert is shown and the user is navigated to the Purchase Coin page. |
| AC-08 | If the buyer has enough coins, the task is saved to mock state and the buyer's coin balance is reduced by the total cost. |
| AC-09 | My Tasks page lists all tasks added by the buyer in descending order of completion date with Update and Delete buttons. |
| AC-10 | Update opens a pre-filled edit form allowing changes to Task Title, Task Detail, and Submission Info only. |
| AC-11 | Delete removes the task from mock state and refunds the buyer's coins for remaining unfilled slots (`required_workers × payable_amount`). |
| AC-12 | Purchase Coin page displays 4 coin package cards: 10 coins/$1, 150 coins/$10, 500 coins/$20, 1000 coins/$35. Clicking a card navigates to a dummy payment form. |
| AC-13 | Dummy payment form accepts any card number input and a Pay button. On submit, the purchased coins are added to the buyer's mock balance. |
| AC-14 | Payment History page shows a table of all past purchases with columns: Amount (USD), Coins Received, Date. |

---

### FE-08 — Admin Dashboard — All Screens

> Build all screens accessible to the Admin role.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Admin Home shows four stat cards: Total Workers, Total Buyers, Total Available Coins (sum of all users' coins), Total Payments. |
| AC-02 | Admin Home shows a Withdrawal Requests table listing all pending requests with columns: Worker Name, Email, Amount, Payment Method, Account Number, and a Mark as Paid button. |
| AC-03 | Clicking Mark as Paid updates withdrawal status to `approved` in mock state and decreases the worker's coin balance by `withdrawal_coin`. |
| AC-04 | Manage Users page shows a table of all users with columns: Name, Email, Photo, Role, Coin, and action buttons. |
| AC-05 | Admin can delete a user — removes from mock state immediately. |
| AC-06 | Admin can change a user's role via an inline dropdown (Worker / Buyer / Admin) — change reflects immediately in mock state. |
| AC-07 | Manage Tasks page shows all tasks in a table with task info and a Delete button that removes the task from mock state. |

---

### FE-09 — Notification System UI

> Build the notification bell and popup UI connected to mock notification data.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Notification bell icon in the dashboard header shows a badge with the count of notifications for the current user from mock data. |
| AC-02 | Clicking the bell opens a floating popup listing notifications sorted newest first. |
| AC-03 | Each notification item shows the message text and a relative timestamp (e.g., "2 hours ago"). |
| AC-04 | Clicking anywhere outside the popup closes it. |
| AC-05 | Mock notification data includes examples for: submission approved, submission rejected, withdrawal approved, new submission received. |
| AC-06 | Notification popup is responsive and does not overflow the viewport on mobile. |

---

## 3. Backend Epics

> Build a RESTful API server. All endpoints return JSON. Use MongoDB for persistence and JWT for all authentication and authorization. Once all backend epics are done, replace every frontend mock call with the corresponding real API call.

---

### BE-01 — Project Setup & Database Connection

> Initialize the server project, connect to MongoDB, and configure environment variables.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Node.js/Express server initializes and starts without errors on `npm start`. |
| AC-02 | MongoDB connection is established using a URI stored in `.env` — never hard-coded. |
| AC-03 | CORS is configured to accept requests from the frontend origin. |
| AC-04 | A health-check endpoint `GET /health` returns `{ status: "ok" }`. |
| AC-05 | All sensitive values are loaded from environment variables — no secrets in source code. |

---

### BE-02 — JWT Authentication & Authorization

> Implement JWT-based auth with role-based middleware protecting all relevant routes.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `POST /api/auth/register` accepts `{ name, email, password, photoURL, role }` and creates a new user. Returns a signed JWT. |
| AC-02 | `POST /api/auth/login` accepts `{ email, password }` and returns a signed JWT on success, or `401` on failure. |
| AC-03 | `POST /api/auth/google` accepts a Google ID token, verifies it, creates or finds the user, and returns a signed JWT. |
| AC-04 | JWT payload contains `{ userId, email, role }`. |
| AC-05 | A `verifyToken` middleware validates the `Authorization: Bearer <token>` header and attaches the decoded user to `req.user`. Returns `401` if missing or invalid. |
| AC-06 | A `verifyWorker` middleware returns `403` if `req.user.role !== 'worker'`. |
| AC-07 | A `verifyBuyer` middleware returns `403` if `req.user.role !== 'buyer'`. |
| AC-08 | A `verifyAdmin` middleware returns `403` if `req.user.role !== 'admin'`. |
| AC-09 | New Worker accounts receive exactly 10 coins; new Buyer accounts receive exactly 50 coins — only on registration, never on login. |

---

### BE-03 — User Management API

> CRUD operations for users and coin balances.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `GET /api/users` (Admin only) returns all users with fields: name, email, photoURL, role, coin. |
| AC-02 | `PATCH /api/users/:id/role` (Admin only) updates the user's role. Accepts `{ role: 'worker' \| 'buyer' \| 'admin' }`. |
| AC-03 | `DELETE /api/users/:id` (Admin only) removes the user from the database. |
| AC-04 | `GET /api/users/top-workers` (Public) returns the top 6 users with the highest coin count and role of `worker`. |
| AC-05 | `GET /api/users/me` (Authenticated) returns the current user's profile including up-to-date coin balance. |
| AC-06 | All admin endpoints return `403` if called with a non-admin JWT. |

---

### BE-04 — Task Management API

> Create, read, update, and delete tasks with coin deduction logic.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `POST /api/tasks` (Buyer only) creates a new task. Required fields: `task_title`, `task_detail`, `required_workers`, `payable_amount`, `completion_date`, `submission_info`, `task_image_url`, `buyer_email`, `buyer_name`. |
| AC-02 | On task creation, total cost (`required_workers × payable_amount`) is deducted from the buyer's coin balance. Returns `400` if insufficient coins. |
| AC-03 | `GET /api/tasks` (Authenticated) returns all tasks where `required_workers > 0`. |
| AC-04 | `GET /api/tasks/:id` (Authenticated) returns full details of a single task. |
| AC-05 | `GET /api/tasks/buyer/:email` (Buyer only) returns all tasks created by that buyer, sorted by `completion_date` descending. |
| AC-06 | `PATCH /api/tasks/:id` (Buyer only, must be task owner) allows updating `task_title`, `task_detail`, `submission_info` only. |
| AC-07 | `DELETE /api/tasks/:id` (Buyer only, must be task owner) deletes the task and refunds the buyer's coins for uncompleted slots (`required_workers × payable_amount`). |
| AC-08 | `DELETE /api/tasks/:id` when called by Admin deletes the task without any coin refund. |
| AC-09 | `GET /api/tasks/admin/all` (Admin only) returns all tasks regardless of `required_workers` count. |

---

### BE-05 — Submission API

> Workers submit task work; Buyers approve or reject submissions.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `POST /api/submissions` (Worker only) creates a new submission with fields: `task_id`, `task_title`, `payable_amount`, `worker_email`, `worker_name`, `buyer_name`, `buyer_email`, `submission_details`, `current_date`, `status = 'pending'`. |
| AC-02 | `GET /api/submissions/worker/:email` (Worker only) returns all submissions by that worker. Supports pagination via `?page=` and `?limit=` query params. Response includes `totalPages`, `currentPage`, `totalItems`. |
| AC-03 | `GET /api/submissions/buyer/:email` (Buyer only) returns all pending submissions for tasks owned by that buyer. |
| AC-04 | `PATCH /api/submissions/:id/approve` (Buyer only) sets status to `approved`, adds `payable_amount` to the worker's coin balance, and creates a notification for the worker. |
| AC-05 | `PATCH /api/submissions/:id/reject` (Buyer only) sets status to `rejected`, increments `required_workers` by 1 on the related task, and creates a notification for the worker. |
| AC-06 | A buyer cannot approve or reject a submission for a task they do not own — returns `403`. |

---

### BE-06 — Withdrawal API

> Workers request withdrawals; Admin approves and deducts coins.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `POST /api/withdrawals` (Worker only) creates a withdrawal request with fields: `worker_email`, `worker_name`, `withdrawal_coin`, `withdrawal_amount`, `payment_system`, `account_number`, `withdraw_date`, `status = 'pending'`. |
| AC-02 | Returns `400` if the worker has fewer than 200 coins at the time of request. |
| AC-03 | Returns `400` if `withdrawal_coin` exceeds the worker's current coin balance. |
| AC-04 | `GET /api/withdrawals/pending` (Admin only) returns all withdrawal requests with `status = 'pending'`. |
| AC-05 | `PATCH /api/withdrawals/:id/approve` (Admin only) sets status to `approved`, deducts `withdrawal_coin` from the worker's coin balance, and creates a notification for the worker. |

---

### BE-07 — Dummy Payment API

> Buyers simulate purchasing coins — no real payment gateway involved.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `POST /api/payments` (Buyer only) accepts `{ amount_usd, coins, buyer_email }` and records a successful payment. |
| AC-02 | On success, the buyer's coin balance is increased by `coins`. |
| AC-03 | A payment record is saved with: `buyer_email`, `amount_usd`, `coins`, `payment_date`. |
| AC-04 | `GET /api/payments/:email` (Buyer only) returns all past payment records for that buyer. |
| AC-05 | Server validates the four allowed packages: `{ 1: 10, 10: 150, 20: 500, 35: 1000 }`. Any other `amount_usd` value returns `400`. |

---

### BE-08 — Notification API

> Create and retrieve in-app notifications as side-effects of key platform actions.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | Notifications are created server-side as a side-effect of: submission approved (to worker), submission rejected (to worker), withdrawal approved (to worker), new submission received (to buyer). |
| AC-02 | Notification document shape: `{ message, toEmail, actionRoute, createdAt }`. |
| AC-03 | `GET /api/notifications/:email` (Authenticated, `email` must match `req.user.email`) returns all notifications for that email sorted by `createdAt` descending. |
| AC-04 | Endpoint returns `403` if the requested email does not match the authenticated user's email. |

---

### BE-09 — Admin Stats API

> Aggregated platform statistics for the Admin dashboard.

**Acceptance Criteria**

| ID | Criteria |
|---|---|
| AC-01 | `GET /api/admin/stats` (Admin only) returns a single object: `{ totalWorkers, totalBuyers, totalCoins, totalPayments }`. |
| AC-02 | `totalCoins` is the sum of the `coin` field across all users. |
| AC-03 | `totalPayments` is the count of all documents in the payments collection. |
| AC-04 | Endpoint returns `403` for non-admin tokens. |

---

## 4. Mock Data Shapes (Frontend Reference)

> Define these in `src/mock/mockData.js`. The backend must return data in exactly these shapes.

### User
| Field | Type | Notes |
|---|---|---|
| `_id` | string | MongoDB ObjectId |
| `name` | string | |
| `email` | string | Unique |
| `photoURL` | string | |
| `role` | string | `'worker'` \| `'buyer'` \| `'admin'` |
| `coin` | number | 10 (worker) or 50 (buyer) on registration |

### Task
| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `task_title` | string | |
| `task_detail` | string | |
| `required_workers` | number | Decrements as submissions are approved |
| `payable_amount` | number | Per worker |
| `completion_date` | string | ISO date string |
| `submission_info` | string | What the worker should submit as proof |
| `task_image_url` | string | |
| `buyer_email` | string | |
| `buyer_name` | string | |

### Submission
| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `task_id` | string | |
| `task_title` | string | |
| `payable_amount` | number | |
| `worker_email` | string | |
| `worker_name` | string | |
| `buyer_name` | string | |
| `buyer_email` | string | |
| `submission_details` | string | Worker's proof/screenshot info |
| `current_date` | string | ISO date string |
| `status` | string | `'pending'` \| `'approved'` \| `'rejected'` |

### Withdrawal
| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `worker_email` | string | |
| `worker_name` | string | |
| `withdrawal_coin` | number | |
| `withdrawal_amount` | number | USD (`withdrawal_coin / 20`) |
| `payment_system` | string | e.g. `'bkash'`, `'nagad'` |
| `account_number` | string | |
| `withdraw_date` | string | ISO date string |
| `status` | string | `'pending'` \| `'approved'` |

### Notification
| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `message` | string | Human-readable notification text |
| `toEmail` | string | Recipient's email |
| `actionRoute` | string | e.g. `/dashboard/worker-home` |
| `createdAt` | string | ISO date string |

---

## 5. Recommended Development Order

### Phase 1 — Frontend (Mock Data)

| Step | Epic | Goal |
|---|---|---|
| 1 | FE-01 | Project setup, dependencies, folder structure, mockData.js, env vars |
| 2 | FE-02 | Navbar, footer, basic route placeholders |
| 3 | FE-03 | Home page — slider, top workers, testimonials, extra sections |
| 4 | **FE-04** | **Authentication — AuthContext, token handling, protected routes, role guards, register & login UI (do this all at once after learning auth concepts)** |
| 5 | FE-05 | Dashboard shell layout with role-based navigation |
| 6 | FE-06 | Complete Worker dashboard screens |
| 7 | FE-07 | Complete Buyer dashboard screens |
| 8 | FE-08 | Complete Admin dashboard screens |
| 9 | FE-09 | Notification bell and popup |

### Phase 2 — Backend (Real API)

| Step | Epic | Goal |
|---|---|---|
| 1 | BE-01 | Server setup, MongoDB connection, environment variables |
| 2 | BE-02 | JWT auth endpoints and role-based middleware |
| 3 | BE-03 | User management endpoints |
| 4 | BE-04 | Task CRUD endpoints with coin deduction logic |
| 5 | BE-05 | Submission endpoints with approve/reject logic |
| 6 | BE-06 | Withdrawal endpoints |
| 7 | BE-07 | Dummy payment endpoint |
| 8 | BE-08 | Notification side-effects and retrieval endpoint |
| 9 | BE-09 | Admin stats aggregation endpoint |
| 10 | Integration | Swap all frontend mock calls with real API fetch/axios calls |

---

*End of Document — Micro-Task & Earning Platform PRD v1.0*
