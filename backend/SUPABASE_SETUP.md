# Supabase Setup Instructions

This backend is now configured to use Supabase as the database and authentication provider.

## Environment Variables

The following environment variables have been added to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://gbitixrofmoxxtkgmbwm.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:YMFjFBhpBH3P7Enf@db.gbitixrofmoxxtkgmbwm.supabase.co:5432/postgres
DB_PASSWORD=YMFjFBhpBH3P7Enf
```

## Database Setup

1. **Run the initial schema migration:**

   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the content from `sql/001_initial_schema.sql`
   - Execute the SQL to create the tables and policies

2. **Tables created:**

   - `users` - User accounts with basic profile information
   - `transcriptions` - Audio transcription records

3. **Features enabled:**
   - Row Level Security (RLS) for data protection
   - Automatic `updated_at` timestamp updates
   - Proper indexes for performance
   - Foreign key relationships

## Authentication

The backend now includes Supabase authentication middleware:

- **File:** `src/middleware/supabaseAuth.ts`
- **Usage:** Import and use `authenticateUser` or `requireAuth` middleware in your routes
- **Token format:** Bearer token in Authorization header

Example usage in routes:

```typescript
import { authenticateUser } from "../middleware/supabaseAuth";

router.get("/protected-route", authenticateUser, (req, res) => {
  // req.user will contain authenticated user info
  console.log("User ID:", req.user.id);
});
```

## Services Updated

Both `UserService` and `TranscriptionService` have been updated to use Supabase:

- **UserService:** CRUD operations for user management
- **TranscriptionService:** CRUD operations for transcription management

## Database Schema

### Users Table

```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- name (VARCHAR)
- password (VARCHAR) - Optional, for non-OAuth users
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Transcriptions Table

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- title (VARCHAR)
- text (TEXT)
- language (VARCHAR)
- confidence (DECIMAL)
- duration (INTEGER) - in seconds
- word_count (INTEGER)
- file_url (TEXT)
- status (ENUM: pending, processing, completed, failed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Connection Options

Your Supabase project provides multiple connection options:

1. **Direct Connection** (for migrations/admin tasks):

   ```
   postgresql://postgres:YMFjFBhpBH3P7Enf@db.gbitixrofmoxxtkgmbwm.supabase.co:5432/postgres
   ```

2. **Transaction Pooler** (recommended for applications):

   ```
   postgresql://postgres.gbitixrofmoxxtkgmbwm:YMFjFBhpBH3P7Enf@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

3. **Session Pooler** (for applications with fewer connections):
   ```
   postgresql://postgres.gbitixrofmoxxtkgmbwm:YMFjFBhpBH3P7Enf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

## Next Steps

1. **Set up your database schema:**
   - Run the SQL migration in your Supabase dashboard
2. **Test the connection:**

   - Start your backend server: `pnpm dev`
   - The Supabase client will automatically connect using your environment variables

3. **Frontend Integration:**

   - Install `@supabase/supabase-js` in your frontend
   - Use the same SUPABASE_URL and SUPABASE_ANON_KEY for client-side operations

4. **Authentication Flow:**
   - Use Supabase Auth for user registration/login
   - Include the JWT token in API requests to your backend
   - The backend middleware will validate tokens and provide user context

## Security Notes

- ✅ Row Level Security (RLS) is enabled
- ✅ Environment variables are properly configured
- ✅ API keys are set up for development
- ⚠️ Remember to update JWT_SECRET for production
- ⚠️ Consider using environment-specific API keys for production

## Testing

To test your Supabase integration:

1. Create a user through Supabase Auth
2. Make authenticated requests to your API endpoints
3. Verify data is properly stored in Supabase tables
