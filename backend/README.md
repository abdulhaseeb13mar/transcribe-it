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
