# Transcribe It - Frontend Authentication System

## Overview

This frontend application implements a comprehensive authentication system with two types of users:

1. **Super Admin** - System administrator with access to organization management
2. **Organization Admin** - Organization-level administrators with access to their organization's dashboard

## Architecture

### Tech Stack

- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **Redux Toolkit** with Redux Persist for state management
- **Shadcn/ui** components with Tailwind CSS for styling
- **Vite** for development and build tooling

### Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          # Reusable login form component
│   │   └── ProtectedRoute.tsx     # Route protection wrapper
│   ├── dashboard/
│   │   ├── OrganizationDashboard.tsx  # Organization admin dashboard
│   │   └── SuperAdminDashboard.tsx    # Super admin dashboard
│   └── ui/                        # Shadcn UI components
├── routes/
│   ├── index.tsx                  # Home page with login options
│   ├── login.tsx                  # Organization admin login
│   ├── dashboard.tsx              # Organization dashboard route
│   └── admin/
│       ├── index.tsx              # Super admin login
│       └── dashboard.tsx          # Super admin dashboard route
├── store/
│   ├── index.ts                   # Redux store configuration
│   └── slices/
│       ├── authSlice.ts           # Authentication state management
│       └── appSlice.ts            # General app state
└── styles.css                     # Global styles with dashboard color scheme
```

## Authentication Flow

### User Types & Routes

#### Super Admin

- **Login Route**: `/admin`
- **Dashboard Route**: `/admin/dashboard`
- **Credentials** (Demo):
  - Email: `admin@transcribe.com`
  - Password: `admin123`
- **Capabilities**:
  - Create new organizations
  - View all users across organizations
  - View all organizations
  - System-wide administration

#### Organization Admin

- **Login Route**: `/login`
- **Dashboard Route**: `/dashboard`
- **Credentials** (Demo): Any valid email with password length >= 6
- **Capabilities**:
  - Access organization-specific dashboard
  - Organization-level management (features to be implemented)

### Route Protection

- Routes are protected using the `ProtectedRoute` component
- Automatic redirection based on user role after login
- Persistent authentication state using Redux Persist

## Features Implemented

### 1. Authentication System

- ✅ Role-based authentication (Super Admin vs Organization Admin)
- ✅ Persistent login state across browser sessions
- ✅ Automatic route protection and redirection
- ✅ Form validation and error handling

### 2. Super Admin Dashboard

- ✅ Overview tab with system statistics
- ✅ Organizations management with creation dialog
- ✅ Users table showing all system users
- ✅ Tabbed navigation interface

### 3. Organization Admin Dashboard

- ✅ Clean dashboard layout
- ✅ Organization information display
- ✅ Logout functionality
- ✅ Placeholder areas for future features

### 4. UI/UX Design

- ✅ Professional dashboard color scheme (blues and grays)
- ✅ Responsive design with Tailwind CSS
- ✅ Consistent component library using Shadcn/ui
- ✅ Modern gradient backgrounds and clean layouts
- ✅ Proper navigation and user feedback

## Demo Credentials

### Super Admin

```
Email: admin@transcribe.com
Password: admin123
```

### Organization Admin

```
Email: any-valid@email.com
Password: any-password-6+chars
```

## Getting Started

1. **Install Dependencies**

   ```bash
   cd frontend
   pnpm install
   ```

2. **Start Development Server**

   ```bash
   pnpm run dev
   ```

3. **Access the Application**
   - Home page: http://localhost:3000
   - Organization login: http://localhost:3000/login
   - Super admin login: http://localhost:3000/admin

## Next Steps

### Backend Integration

- Replace mock authentication with actual API calls
- Implement JWT token handling
- Add refresh token logic
- Connect to backend user and organization services

### Features to Implement

- Password reset functionality
- User profile management
- Organization settings
- Real-time notifications
- Advanced user permissions
- Audit logging

### Security Enhancements

- Input sanitization
- CSRF protection
- Rate limiting
- Session management
- Security headers

## Development Notes

### Mock Authentication

Currently uses mock authentication logic:

- Super admin: Exact email/password match
- Organization admin: Email format validation + password length check

### State Management

- Redux Toolkit for authentication state
- Redux Persist for persistent sessions
- Type-safe selectors and actions

### Routing

- File-based routing with TanStack Router
- Automatic route tree generation
- Type-safe navigation

### Component Design

- Reusable authentication components
- Consistent styling with Shadcn/ui
- Responsive layouts
- Accessible form controls
