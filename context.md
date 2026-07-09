# CONTEXT.md — Auhentic Variable & Syntax Reference
> Every variable name, field name, env key, CSS class, and pattern used across the project.

---

## Environment Variables

```bash
# .env.local

MONGODB_URI=                  # MongoDB Atlas connection string
JWT_SECRET=                   # Secret for signing/verifying JWT tokens
ADMIN_SETUP_KEY=              # One-time key for first admin account creation

CLOUDINARY_CLOUD_NAME=        # Cloudinary account cloud name
CLOUDINARY_API_KEY=           # Cloudinary API key
CLOUDINARY_API_SECRET=        # Cloudinary API secret

BREVO_SMTP_USER=              # Brevo SMTP username (usually your login email)
BREVO_SMTP_PASS=              # Brevo SMTP password/API key
BREVO_FROM_EMAIL=             # Sender address shown in emails (e.g. no-reply@auhentic.com)

NODE_ENV=                     # 'development' | 'production'
```

---

## JWT Token

**Cookie name:** `token`

**Payload shape (what's inside the JWT):**
```js
{
  id: user._id,       // MongoDB ObjectId as string
  email: user.email,
  role: user.role,    // 'customer' | 'admin' | 'sub-admin'
}
```

**Cookie config:**
```js
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,   // 7 days in seconds
  path: '/',
}
```

---

## MongoDB Models

### User
```js
{
  name: String,                   // required, trimmed
  email: String,                  // required, unique, lowercase
  password: String,               // required, min 6 chars, select: false (never returned by default)
  role: String,                   // 'customer' | 'admin' | 'sub-admin', default: 'customer'
  phone: String,
  address: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
  },
  offer: {
    isOnOffer: Boolean,           // default: false
    discountPercent: Number,      // default: 0
    offerLabel: String,           // default: ''
    offerExpiry: Date,            // default: null
  },
  photo: {
    url: String,                  // Cloudinary secure_url
    publicId: String,             // Cloudinary public_id
  },
  createdAt: Date,                // auto via timestamps
  updatedAt: Date,
}

// Instance method:
user.comparePassword(candidatePassword)   // returns Promise<Boolean>

// Pre-save hook:
// auto-hashes password with bcrypt (rounds: 12) on create/password change
```

### Product
```js
{
  name: String,                   // required, trimmed
  description: String,            // required
  price: Number,                  // required, min 0
  category: String,               // required, trimmed
  images: [
    {
      url: String,                // Cloudinary secure_url (required)
      publicId: String,           // Cloudinary public_id (required)
    }
  ],
  stock: Number,                  // required, default: 0, min: 0
  isAvailable: Boolean,           // default: true
  offer: {
    isOnOffer: Boolean,           // default: false
    discountPercent: Number,      // 0–100, default: 0
    offerLabel: String,           // default: '', trimmed
  },
  reviews: [
    {
      user: ObjectId,             // ref: 'User'
      name: String,               // snapshot of user's name
      rating: Number,             // 1–5
      comment: String,
      createdAt, updatedAt,
    }
  ],
  avgRating: Number,              // auto-calculated on pre-save
  numReviews: Number,             // auto-calculated on pre-save
  createdAt, updatedAt,
}

// Pre-save hook:
// auto-recalculates avgRating and numReviews from reviews array
```

### Order
```js
{
  user: ObjectId | null,          // ref: 'User', null for guests
  guestInfo: {
    name: String,
    email: String,
    phone: String,
  },
  items: [
    {
      productId: ObjectId,        // ref: 'Product'
      name: String,               // snapshot at time of order
      image: String,              // snapshot (images[0].url)
      price: Number,              // snapshot
      quantity: Number,           // min: 1
    }
  ],
  shippingAddress: {
    street: String,               // required
    city: String,                 // required
    district: String,             // required — matched against settings.districtDelivery
    postalCode: String,
    phone: String,                // required
  },
  paymentMethod: String,          // 'COD' | 'SSLCommerz' | 'bKash' | 'Nagad' | 'Rocket'
  paymentStatus: String,          // 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  transactionId: String,          // for online payments
  orderStatus: String,            // 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  statusHistory: [
    {
      status: String,
      note: String,
      updatedAt: Date,
    }
  ],
  subtotal: Number,               // required
  shippingCost: Number,           // default: 0
  total: Number,                  // required (subtotal + shippingCost)
  note: String,                   // customer note
  isArchivedByAdmin: Boolean,     // soft delete — default: false, revenue unaffected
  createdAt, updatedAt,
}
```

### Cart
```js
{
  user: ObjectId,                 // ref: 'User', unique (one cart per user)
  items: [
    {
      product: ObjectId,          // ref: 'Product'
      quantity: Number,           // min: 1, default: 1
    }
  ],
  createdAt, updatedAt,
}

// Virtual:
cart.itemCount   // sum of all item quantities
```

### Settings
```js
{
  key: String,                    // always 'site_settings' (unique, singleton pattern)
  shopName: String,               // default: 'Auhentic'
  tagline: String,
  email: String,
  phone: String,
  whatsapp: String,
  address: String,
  deliveryAreas: String,
  facebook: String,
  instagram: String,
  footerMessage: String,
  freeDeliveryAmount: Number,     // default: 500 (BDT threshold for free shipping)
  freeDeliveryText: String,
  districtDelivery: [
    {
      district: String,           // district name (must match shippingAddress.district exactly)
      charge: Number,             // delivery charge in BDT
    }
  ],
  createdAt, updatedAt,
}
```

### OTP
```js
{
  email: String,
  otp: String,                    // 6-digit number stored as string
  createdAt: Date,                // TTL index: auto-expires after 600 seconds (10 mins)
}
```

---

## API Route Patterns

### Response shape — success
```js
// List
{ success: true, data: [...] }

// Single item
{ success: true, data: { ...doc } }

// Create/Update with message
{ message: 'Created', product: { ...doc } }

// Simple confirm
{ message: 'Action done' }
```

### Response shape — error
```js
{ message: 'Human readable error string' }
```

### HTTP status codes used
```
200  GET success, POST success (non-create actions like login)
201  POST create success
400  Validation error / bad input
401  Not authenticated (no token or expired)
403  Authenticated but wrong role
404  Document not found
409  Conflict (email already exists, admin already exists)
500  Unexpected server error
```

---

## lib/ Utilities

### lib/auth.js

```js
signToken(payload)
// payload: { id, email, role }
// returns: JWT string, expires in 7d

verifyToken(token)
// returns: decoded payload | null (never throws)

getAuthUser()
// reads 'token' cookie from Next.js headers
// returns: decoded payload | null
// usage: const user = await getAuthUser();

setTokenCookie(res, token)
// sets httpOnly cookie on a NextResponse object
// usage: setTokenCookie(response, token);
```

### lib/mongodb.js

```js
connectDB()
// connects to MongoDB Atlas with global cache (safe to call on every request)
// uses dns.setServers(['1.1.1.1', '8.8.8.8']) to bypass ISP-level DNS blocking in BD
// usage: await connectDB();
// global cache key: global.mongoose → { conn, promise }
```

### lib/cloudinary.js

```js
// exports cloudinary v2 instance, pre-configured
// usage: import cloudinary from '@/lib/cloudinary';
//        await cloudinary.uploader.destroy(publicId);
```

### lib/brevo.js

```js
sendOTPEmail(toEmail, otp)
// sends 6-digit OTP via Brevo SMTP (smtp-relay.brevo.com:587)
// from: BREVO_FROM_EMAIL env
// template: inline HTML, brand color #c8860a
```

---

## Cloudinary Upload Conventions

```
Folder:         auhentic/products
publicId:       returned by Cloudinary after upload (save it alongside url)
Transforms:     width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto'
Upload API:     upload_stream (accepts Buffer)
Delete API:     cloudinary.uploader.destroy(publicId)
```

Upload response fields used:
```js
result.secure_url   // saved as images[].url
result.public_id    // saved as images[].publicId
```

---

## CSS Theme Variables

Defined in `globals.css`:

```css
--wheat:        #F5DEB3    /* warm wheat — main accent color */
--wheat-dark:   #D4A96A    /* darker wheat — hover/emphasis */
--wheat-light:  #FFF8EE    /* near-white warm tint — backgrounds */
```

Green variant (`auhent_green_flat_v4`):
```css
--wheat:        #7ED89A
--wheat-dark:   #3AB54A
--wheat-light:  #EAF7EE
```

---

## CSS Utility Classes

All defined in `globals.css`. Use these instead of raw Tailwind for glassmorphism UI.

```css
.glass
/* frosted glass container */
/* background: rgba(255,255,255,0.35), backdrop-filter: blur(16px) */

.glass-input
/* form inputs inside glass panels */
/* background: rgba(255,255,255,0.45), color: #3b2a1a */

.glass-btn
/* secondary/ghost buttons */
/* hover: rounds to border-radius 25px over 500ms */

.glass-btn-primary
/* primary CTA button */
/* gradient: #c8860a → #e8a020, hover: rounds to border-radius 55px */

.scrollbar-hide
/* hides scrollbar but keeps scroll functional */
/* used in TopSellingSlider and horizontal scroll areas */
```

---

## Background Gradient

Set in `app/layout.js` root div:
```
Wheat theme:  bg-gradient-to-br from-[#fdf0d5] via-[#f5deb3] to-[#c8a06e]
Green theme:  bg-[#3AB54A]   (flat, no gradient)
```

---

## Route Protection (proxy.js)

```js
// Path groups and their rules:

adminPaths     = ['/admin']
// requires: token + role in ['admin', 'sub-admin']
// no token → redirect /auth/login
// wrong role → redirect /

protectedPaths = ['/orders', '/checkout', '/profile']
// requires: any valid token
// no token → redirect /auth/login

authPaths      = ['/auth/login', '/auth/register', '/auth/forgot-password']
// if already logged in → redirect / (or /admin for admin roles)
```

Middleware matcher:
```js
['/admin/:path*', '/orders/:path*', '/checkout/:path*', '/profile/:path*', '/auth/:path*']
```

---

## Shipping Cost Formula

```js
const districtCharge = settings.districtDelivery.find(
  d => d.district === shippingAddress.district
)?.charge ?? 80

const shippingCost = subtotal >= (settings.freeDeliveryAmount || 500)
  ? 0
  : districtCharge

const total = subtotal + shippingCost
```

`shippingAddress.district` must exactly match a `district` string in `settings.districtDelivery[]`.

---

## Product Query Params

```
GET /api/products

?category=Cake          filter by category (case-sensitive string)
?sort=createdAt         createdAt (default) | price | name | top
?order=asc              asc | desc (default: desc)
?page=1                 pagination, default 1
?limit=12               items per page, default 12

Note: sort=top uses { 'ratings.count': -1, 'ratings.average': -1 }
      reviews are excluded from list response (.select('-reviews'))
```

---

## Order Status Enums

```js
orderStatus:
  'placed' → 'confirmed' → 'processing' → 'shipped' → 'delivered'
  any → 'cancelled'   (also auto-sets paymentStatus: 'cancelled')

paymentStatus:
  'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

paymentMethod:
  'COD' | 'SSLCommerz' | 'bKash' | 'Nagad' | 'Rocket'
```

---

## User Role Enums

```js
'customer'      // default on registration
'sub-admin'     // promoted by admin via /api/admin/team
'admin'         // created once via /auth/admin-register + ADMIN_SETUP_KEY
```

Roles assignable via API (PATCH /api/admin/team):
```js
['customer', 'sub-admin']   // only these two — 'admin' cannot be assigned via API
```

---

## Mongoose Singleton Pattern

Used in every model file:
```js
const Model = mongoose.models.ModelName || mongoose.model('ModelName', schema);
export default Model;
```

Why: Next.js hot-reload re-runs module code. Without this, Mongoose throws
"Cannot overwrite model once compiled."

---

## Dot-Notation Nested Update Pattern

Used when updating `offer` subdoc in Product:
```js
// DON'T do this (replaces entire offer object):
{ $set: { offer: body.offer } }

// DO this (merges individual fields):
{ $set: { 'offer.isOnOffer': true, 'offer.discountPercent': 20 } }
```

---

## Status History Push Pattern

When updating orderStatus, always append to history in same operation:
```js
await Order.findByIdAndUpdate(id, {
  $set: { orderStatus, paymentStatus },
  $push: {
    statusHistory: {
      status: orderStatus,
      note: `Status updated to ${orderStatus}`,
      updatedAt: new Date(),
    }
  }
}, { new: true, runValidators: true })
```

Never use two separate `findByIdAndUpdate` calls for this — race condition risk.

---

## Font

```js
// app/layout.js
import { Geist } from 'next/font/google';
const geist = Geist({ subsets: ['latin'] });
// applied via: className={geist.className} on <body>
```

---

## Cloudinary Config Location

Two places configure Cloudinary (both should stay in sync):
- `lib/cloudinary.js` — exported singleton for general use
- `app/api/upload/route.js` — inline config in upload handler (acceptable, standalone route)

---

## OTP Generation

```js
const otp = Math.floor(100000 + Math.random() * 900000).toString();
// always 6 digits, stored as String, compared with === (strict equality)
```

---

## DNS Fix (mongodb.js)

```js
import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
```

Required due to ISP-level DNS blocking of MongoDB Atlas hostnames in Bangladesh.
Do not remove this line.