# Transcribe It - Backend API

A robust Express.js backend API for the Transcribe It application, built with TypeScript.

## Features

- 🚀 Express.js with TypeScript
- 🔐 JWT Authentication
- 🛡️ Security middleware (Helmet, CORS, Rate Limiting)
- 📝 Comprehensive logging
- 🧪 Testing setup with Jest
- 📁 Well-organized folder structure
- 🔧 Environment configuration
- 📊 Health check endpoint

## Project Structure

```
backend/
├── src/
│   ├── __tests__/          # Test files
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── routes/             # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── index.ts
│   ├── services/           # Business logic
│   │   └── userService.ts
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── errors.ts
│   │   ├── helpers.ts
│   │   └── logger.ts
│   └── index.ts            # Main application file
├── dist/                   # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json
├── jest.config.js
├── nodemon.json
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_URL=your-database-url
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## API Endpoints

### Health Check

- `GET /health` - Server health status

### OCR / Translation

- `POST /api/ocr/extract` — Extract text from PDF, DOCX, or image.

  - Request options:
    - Multipart: `multipart/form-data` with a `file` field (requires `multer`).
    - JSON: `application/json` with `{ "contentBase64": string, "fileName?": string, "mimeType?": string }`.
  - Query/body options: `forceOcr` (boolean)
  - Response: `{ type, text, pages?, warnings?, fileName, mimeType, forceOcr }`.

- `POST /api/document/translate-text` — Translate provided text to English, returning Markdown that preserves layout/structure.

  - JSON body: `{ text: string, sourceLang: string, targetLang?: string }` (defaults to English).
  - Response: `{ translation, sourceLang, targetLang }`.

- `POST /api/document/extract-and-translate` — Perform OCR then translate to English in one step. Returns Markdown that mirrors the original document's structure (headings, lists, tables where possible).
  - Multipart: `file` plus fields `sourceLang`, optional `targetLang`, `forceOcr`.
  - JSON: `{ contentBase64, fileName?, mimeType?, sourceLang, targetLang?, forceOcr? }`.
  - Response: `{ translation, meta: { type, text, pages?, warnings? }, fileName, mimeType, sourceLang, targetLang, forceOcr }`.

Notes:

- PDF extraction tries text layer first; if very short (< 50 chars) or `forceOcr=true`, falls back to Gemini OCR when configured.
- DOCX extraction uses raw text conversion.
- Image extraction uses Gemini OCR when configured, otherwise Tesseract (English by default).

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Gemini configuration (required for translation):

- Set one of: `GOOGLE_API_KEY`, `GENAI_API_KEY`, or `API_KEY`.
- Optional: `GENAI_MODEL` (default `gemini-2.5-flash`).

## OCR Dependencies

Install required packages in `backend` to enable extraction:

```
pnpm add multer pdf-parse mammoth tesseract.js @google/genai
pnpm add -D @types/multer
```

or with npm:

```
npm install multer pdf-parse mammoth tesseract.js @google/genai
npm install -D @types/multer
```

Tesseract language: defaults to `eng`. To use other languages, install the language data per tesseract.js docs.

Gemini OCR (optional):

- Set one of: `GOOGLE_API_KEY`, `GENAI_API_KEY`, or `API_KEY`.
- Optional: `GENAI_MODEL` (default `gemini-2.5-flash`).
- Behavior: For PDFs with little/no text (or `forceOcr=true`) and for images, the service uses Gemini OCR. If Gemini rejects a PDF (`INVALID_ARGUMENT`), it retries by treating content as an image.

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": "Additional error details (development only)"
  }
}
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

For paginated responses:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Security Features

- **Helmet** - Sets various HTTP headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Validates request data
- **JWT Authentication** - Secure user sessions

## Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Add route logic with proper error handling
3. Register route in `src/routes/index.ts`
4. Add corresponding service in `src/services/`
5. Write tests in `src/__tests__/`

### Environment Variables

All environment variables should be documented in `.env.example` and have sensible defaults in the code.

## Deployment

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the server:**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Stripe Payments (One-off Credit Purchases)

This backend supports one-off (non-recurring) credit purchases using Stripe Checkout. A payment adds plan credits to the organization's balance once completed.

### Purchase Flow

1. Admin selects a plan in the dashboard.
2. Frontend calls `POST /api/payments/checkout` with `planId`.
3. Backend creates a `Payment` row (status `pending`) and a Stripe Checkout Session.
4. User is redirected to Stripe-hosted checkout.
5. Stripe sends `checkout.session.completed` webhook.
6. Backend webhook handler marks the payment `succeeded`, increments credits, logs a `creditUsage` entry, and upserts `billing` (status ACTIVE).

### Data Model Additions

`Payment` table fields:

- `id` UUID
- `organizationId`
- `planId`
- `amount` (integer, cents)
- `currency` (default `usd`)
- `status` (`pending|succeeded|failed|expired|canceled`)
- Stripe identifiers: `stripeCheckoutSessionId`, `stripePaymentIntentId`

### Local Test Setup

1. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # after starting stripe listen
FRONTEND_SUCCESS_URL=http://localhost:3000/dashboard/plans?status=success
FRONTEND_CANCEL_URL=http://localhost:3000/dashboard/plans?status=cancelled
```

2. Run migrations (if not already):

```bash
pnpm exec prisma migrate dev --name add_payment_model
```

3. Start servers.
4. In another terminal start Stripe CLI forwarding:

```bash
stripe login
stripe listen --forward-to localhost:8000/api/payments/webhook
```

Copy the printed webhook secret into `.env` and restart backend.

### Webhook Verification Note

For production you must ensure the webhook route receives the raw request body. Adjust `index.ts` to register a raw body parser for `/api/payments/webhook` BEFORE `express.json()`, e.g.:

```ts
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentsWebhookHandler
);
```

Then keep normal `app.use(express.json())` for other routes. (The current dev shortcut may not verify signatures if JSON parsing alters the payload.)

### Production Go-Live Checklist

1. Replace test keys with live keys (`sk_live_`, `pk_live_`).
2. Create production webhook endpoint in Stripe dashboard; copy live `STRIPE_WEBHOOK_SECRET`.
3. Set accurate `FRONTEND_SUCCESS_URL` / `FRONTEND_CANCEL_URL` to your domain (HTTPS).
4. Enforce HTTPS, strong CORS, and proper logging (PII free) around payments.
5. Monitor Stripe Dashboard + enable email alerts (failed payments, disputes).
6. Reconcile daily: compare count and total of succeeded `Payment` rows vs Stripe balance transactions.
7. (Optional) Add retry logic / idempotency keys if you introduce direct PaymentIntents.
8. (Optional) Add products/prices in Stripe & reference them instead of dynamic `price_data` for analytics.

### Extending

- Arbitrary credit top-up: accept `credits` param, compute `amount = credits * unitPrice`, create Checkout Session with dynamic line item, record in `Payment` metadata.
- Display purchase history: create `GET /api/payments/history` returning joined `Payment` + `Plan` data.
- Refunds: add endpoint calling `stripe.refunds.create({ payment_intent })` then decrement organization credits (ensure not below zero) & log reversal usage.

### Test Card Numbers

Use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC, any ZIP). See Stripe docs for 3DS, insufficient funds, and dispute simulation cards.
