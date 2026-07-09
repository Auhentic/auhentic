# Auhentic — Project Workflow

## Overview
Single-seller food e-commerce website.
Built with Next.js 15 App Router, MongoDB, Tailwind CSS. No TypeScript.

## Tech Stack
- Framework: Next.js 15 App Router (React Compiler ON)
- Database: MongoDB + Mongoose
- Auth: JWT in httpOnly cookies
- Images: Cloudinary
- Styling: Tailwind CSS (Glassmorphism)
- Payments: SSLCommerz + bKash/Nagad/Rocket

## Two Roles
- Admin: manages products, stock, orders
- Customer (guest): browse, cart, COD checkout
- Customer (logged in): browse, cart, online payment, order tracking, reviews

## Phase 1 — Foundation ✅
### Files Created
- src/lib/mongodb.js — MongoDB connection with global caching
- src/lib/auth.js — JWT sign, verify, read from cookie helpers
- src/lib/cloudinary.js — Cloudinary SDK setup
- .env.local — all secret keys (never push to Git)

### Why global caching in mongodb.js?
Next.js hot reload in dev creates new connections every time.
Caching on the global object reuses the same connection.

### Why httpOnly cookies for JWT?
Browser JavaScript cannot read httpOnly cookies.
This blocks XSS attacks from stealing the token.

### Why Cloudinary?
We never store image files on our server.
Admin uploads image → goes to Cloudinary → we save the URL in MongoDB.

## Phase 2 — Models & Auth ✅

### Mongoose Models ✅
- src/models/User.js
  - Fields: name, email, password (bcrypt hashed, select:false), role, phone, address
  - Methods: comparePassword()
  - Pre-save hook: auto-hashes password on create/update

- src/models/Product.js
  - Fields: name, description, price, category, images (Cloudinary url+publicId), stock, isAvailable
  - Embedded reviews subdocument (user ref, rating, comment)
  - Pre-save hook: auto-calculates avgRating + numReviews

- src/models/Order.js
  - Fields: user (nullable for guests), guestInfo, items (price/name/image snapshot), shippingAddress
  - Payment: paymentMethod (COD/SSLCommerz/bKash/Nagad/Rocket), paymentStatus, transactionId
  - Tracking: orderStatus (placed → confirmed → processing → shipped → delivered → cancelled)
  - Totals: subtotal, shippingCost, total

- src/models/Cart.js
  - Linked to logged-in user (one cart per user, unique index)
  - Items: product ref + quantity
  - Virtual: itemCount

### Auth API Routes ✅
- src/app/api/auth/register/route.js
  - POST — validate fields, check duplicate email, create user, set JWT httpOnly cookie
  - Returns user object (no password)

- src/app/api/auth/login/route.js
  - POST — find user with +password, comparePassword(), set JWT httpOnly cookie
  - Same error message for wrong email/password (prevents user enumeration)

- src/app/api/auth/logout/route.js
  - POST — clears token cookie by setting maxAge: 0

### Middleware ✅
- middleware.js (root)
  - /admin/* — must be logged in + role === 'admin', else redirect to /login
  - /account/*, /orders/*, /checkout/* — must be logged in, else redirect to /login with ?redirect=
  - /login, /register — redirect to / if already logged in
  - Invalid/expired token treated as logged out gracefully
  - matcher config limits middleware to only relevant routes (performance)

## Phase 3 — Coming Next
- Product API routes (CRUD for admin, list/single for public)
- Cart API routes (add, update, remove, clear)
- Order API routes (place order, track, admin management)
- Payment integration (SSLCommerz + bKash/Nagad/Rocket)