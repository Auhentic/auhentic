# WORKFLOW.md — Auhentic
> By the name of ALLAH. This codebase belongs to SK and his senior dev CLAUDE.

---

## Project Overview

Auhentic is a Next.js 16 App Router e-commerce platform for the Bangladesh market. It uses glassmorphism UI, district-based delivery pricing, Cloudinary image management, OTP-verified registration, and COD-first order management.

**Stack:** Next.js 16 (App Router) · MongoDB Atlas · Mongoose · Cloudinary · Brevo SMTP · JWT (httpOnly cookie) · Tailwind CSS v4

---

## Folder Structure

```
/
├── app/
│   ├── (admin)/admin/          # Admin route group
│   │   ├── page.js             # Admin dashboard
│   │   ├── layout.js           # Admin layout (Sidebar)
│   │   ├── orders/page.js      # Order management
│   │   ├── products/page.js    # Product management
│   │   ├── done-product/page.js# Delivered/archived orders
│   │   ├── settings/page.js    # Site settings
│   │   └── team/page.js        # User role management
│   ├── (customer)/             # Customer route group
│   │   ├── page.js             # Homepage/storefront
│   │   ├── layout.js           # Customer layout (Navbar + Footer)
│   │   ├── products/page.js    # Product listing
│   │   ├── products/[id]/page.js   # Product detail + reviews
│   │   ├── cart/page.js        # Cart
│   │   ├── checkout/page.js    # Checkout + address + district
│   │   ├── orders/page.js      # Customer order history
│   │   ├── orders/[id]/page.js # Single order detail
│   │   ├── profile/page.js     # Profile edit
│   │   └── contact/page.js     # Contact page
│   ├── auth/
│   │   ├── login/page.js
│   │   ├── register/page.js    # OTP-verified registration
│   │   ├── forgot-password/page.js
│   │   ├── admin-register/page.js  # One-time admin setup
│   │   └── layout.js
│   ├── api/                    # All API routes (Next.js Route Handlers)
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   ├── register/route.js   # Direct register (no OTP)
│   │   │   ├── logout/route.js
│   │   │   ├── me/route.js
│   │   │   ├── profile/route.js
│   │   │   ├── send-otp/route.js
│   │   │   ├── verify-otp/route.js # OTP-verified register (final step)
│   │   │   ├── forgot-password/route.js
│   │   │   ├── reset-password/route.js
│   │   │   └── admin-register/route.js
│   │   ├── admin/team/route.js
│   │   ├── orders/route.js
│   │   ├── orders/[id]/route.js
│   │   ├── products/route.js
│   │   ├── products/[id]/route.js
│   │   ├── products/[id]/reviews/route.js
│   │   ├── settings/route.js
│   │   └── upload/
│   │       ├── route.js        # Admin product image upload
│   │       └── public/route.js # Public image upload (user avatar)
│   ├── globals.css             # Theme variables + glass utility classes
│   ├── layout.js               # Root layout (font + background gradient)
│   └── page.js                 # Root redirect placeholder
├── components/
│   ├── Navbar.js
│   ├── Footer.js
│   ├── ProductCard.js
│   ├── TopSellingSlider.js
│   └── admin/
│       └── Sidebar.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Cart.js
│   ├── Settings.js
│   └── OTP.js
├── lib/
│   ├── auth.js         # JWT sign/verify/cookie helpers
│   ├── mongodb.js      # Mongoose connection with global cache
│   ├── cloudinary.js   # Cloudinary v2 config
│   └── brevo.js        # Nodemailer via Brevo SMTP
└── proxy.js            # Middleware logic (route protection)
```

---

## Authentication Flow

### Customer Registration (OTP-verified)
```
1. User fills name/email/phone/password on /auth/register
2. POST /api/auth/send-otp  →  generates 6-digit OTP, saves to OTP collection, emails via Brevo
3. User enters OTP on same page
4. POST /api/auth/verify-otp  →  validates OTP, deletes OTP doc, creates User, signs JWT, sets httpOnly cookie
5. Redirect → /
```

### Login
```
1. POST /api/auth/login  →  finds user, comparePassword(), signs JWT, sets cookie
2. Role check: if admin/sub-admin → redirect /admin, else → redirect /
```

### Forgot Password
```
1. POST /api/auth/forgot-password  →  finds user (silent if not found), sends OTP via Brevo
2. POST /api/auth/reset-password  →  validates OTP, sets user.password = newPassword, save() triggers pre-save hash
3. OTP deleted after use
```

### Admin Setup (one-time)
```
POST /api/auth/admin-register
Body: { name, email, password, setupKey }
- Checked against process.env.ADMIN_SETUP_KEY
- Rejected if any admin already exists in DB
```

### Middleware (proxy.js)
```
/admin/*            → must be logged in + role: admin | sub-admin
/orders/*, /checkout/*, /profile/*  → must be logged in
/auth/login, /auth/register, /auth/forgot-password  → redirect away if already logged in
```

---

## Order Flow

### Place Order (POST /api/orders)
```
1. getAuthUser() — can be null (guest allowed for COD)
2. Validate: items, shippingAddress, paymentMethod required
3. Guest + non-COD → reject (login required for online payment)
4. For each item:
   - Find product by productId
   - Check isAvailable + stock
   - Snapshot: name, image (images[0].url), price, quantity
5. Fetch Settings → find districtDelivery charge for shippingAddress.district
   - Default charge: 80 if district not in settings
   - Free delivery if subtotal >= settings.freeDeliveryAmount (default 500)
6. Create Order document
7. Decrement stock: Product.findByIdAndUpdate($inc stock)
```

### Update Order (PATCH /api/orders/[id]) — Admin only
```
Body: { orderStatus?, paymentStatus? }
- Uses $set + $push in one update operation (NOT two separate calls)
- Cancelling order → auto sets paymentStatus: 'cancelled'
- Appends to statusHistory array on every status change
```

### Archive Order (DELETE /api/orders/[id]) — Admin only
```
Soft delete: sets isArchivedByAdmin: true
Does NOT delete the document — revenue stats are preserved
```

---

## Product Flow

### Create Product (POST /api/products) — Admin only
```
1. Upload images first via POST /api/upload (returns url + publicId each)
2. POST /api/products with: { name, description, price, category, images: [{url, publicId}], stock, offer }
```

### Update Product (PATCH /api/products/[id]) — Admin only
```
- reviews, avgRating, numReviews are deleted from body before update (prevents manipulation)
- offer object is flattened to dot-notation: offer.isOnOffer, offer.discountPercent, etc.
  (so MongoDB $set merges instead of replacing the whole offer subdoc)
```

### Delete Product (DELETE /api/products/[id]) — Admin only
```
1. Find product
2. Promise.all → cloudinary.uploader.destroy(img.publicId) for each image
3. product.deleteOne()
```

### Query Parameters (GET /api/products)
```
?category=    filter by category string
?sort=        createdAt (default) | price | name | top
?order=       asc | desc (default desc)
?page=        pagination page number (default 1)
?limit=       items per page (default 12)
```

---

## Settings Flow

- Single document, always keyed `key: 'site_settings'`
- GET `/api/settings` — public (used by Footer, Contact, Checkout)
- PUT `/api/settings` — admin only
- districtDelivery array is stripped of `_id` before saving (prevents Mongoose cast errors)
- upsert: true — auto-creates if missing

---

## Image Upload Flow

### Product Images (admin only)
```
POST /api/upload
FormData: { image: File }
Cloudinary folder: auhentic/products
Transforms: width 800, height 800, crop: limit, quality: auto, format: auto
Returns: { url, publicId }
```

### Public Images (user avatar)
```
POST /api/upload/public
Same process, for customer profile photos
```

---

## Role System

| Role | Access |
|------|--------|
| `customer` | Customer routes, own orders only |
| `sub-admin` | Admin panel (read + manage), cannot change settings |
| `admin` | Full access, can promote/demote users, manage settings |

Role promotion/demotion: PATCH `/api/admin/team` with `{ userId, role }`
Only `customer` ↔ `sub-admin` switching allowed. `admin` role cannot be assigned via API.

---

## OTP Collection Behavior

- TTL index on `createdAt` field: expires after 600 seconds (10 minutes)
- Old OTPs for same email are deleted before generating a new one (`OTP.deleteMany`)
- OTP is deleted after successful verification (both registration and password reset)

---

## Shipping Cost Logic

```js
const districtCharge = settings.districtDelivery.find(
    d => d.district === shippingAddress.district
)?.charge ?? 80  // fallback 80 if district not configured

const shippingCost = subtotal >= settings.freeDeliveryAmount ? 0 : districtCharge
```

Free delivery threshold comes from `settings.freeDeliveryAmount` (default: 500 BDT).

---

## Key Patterns Used

**Auth check in API routes:**
```js
const user = await getAuthUser();       // reads cookie, verifies JWT
if (!user || user.role !== 'admin') { ... }
```

**DB connection at top of every route:**
```js
await connectDB();  // uses global cache, safe to call on every request
```

**Mongoose model singleton:**
```js
const Model = mongoose.models.ModelName || mongoose.model('ModelName', schema);
```

**Parallel DB calls:**
```js
const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit),
    Product.countDocuments(filter),
]);
```

**Dot-notation for nested update (prevents full subdoc replace):**
```js
updateData['offer.isOnOffer'] = body.offer.isOnOffer;
// instead of: { $set: { offer: body.offer } }
```

**Stock decrement on order:**
```js
await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
```