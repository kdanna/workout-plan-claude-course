# Routing Standards

This document outlines the routing conventions and standards for the workout plan application.

## Route Structure

### Base Route
All application routes are accessed under the `/dashboard` prefix:
- `/dashboard` - Main dashboard page
- `/dashboard/*` - All sub-pages and features

### Route Protection

**All dashboard routes must be protected and only accessible to authenticated users.**

#### Implementation: Next.js Middleware

Route protection is implemented using Next.js middleware (`middleware.ts` in the project root).

**Key Requirements:**
- Middleware must check authentication status before allowing access to `/dashboard` routes
- Unauthenticated users should be redirected to the login page
- Authentication checks should happen at the middleware level, not in individual page components
- The middleware should run on all `/dashboard/*` routes using matcher configuration

#### Example Middleware Pattern

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication (implementation depends on auth provider)
  const isAuthenticated = checkAuth(request);

  if (!isAuthenticated) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

## Route Organization

### Page Structure
```
app/
├── dashboard/
│   ├── page.tsx           # Main dashboard (/dashboard)
│   ├── layout.tsx         # Dashboard layout (shared across all dashboard pages)
│   ├── [feature]/
│   │   └── page.tsx       # Feature page (/dashboard/[feature])
│   └── [feature]/
│       └── [id]/
│           └── page.tsx   # Dynamic feature detail (/dashboard/[feature]/[id])
```

### Naming Conventions

- Use **kebab-case** for route segments: `/dashboard/workout-plan`
- Use **dynamic segments** with brackets for IDs: `/dashboard/workout/[workoutId]`
- Keep route names descriptive and RESTful where applicable

### Navigation

When navigating between dashboard routes:
- Use Next.js `<Link>` component for client-side navigation
- Always use absolute paths starting with `/dashboard`
- Avoid hardcoding URLs; consider using a route constants file for maintainability

```typescript
// Example route constants
export const ROUTES = {
  DASHBOARD: '/dashboard',
  WORKOUT_DETAIL: (id: string) => `/dashboard/workout/${id}`,
  CREATE_WORKOUT: '/dashboard/workout/create',
} as const;
```

## Public vs Protected Routes

### Public Routes
Routes that should NOT require authentication:
- `/` - Landing/home page
- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Password reset

### Protected Routes
All routes under `/dashboard/*` require authentication.

## Middleware Configuration

### Matcher Patterns
The middleware matcher should be configured to:
- **Include**: All `/dashboard/*` routes
- **Exclude**: Static files, API routes (unless they also need protection)

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    // Add other protected routes as needed
  ],
};
```

### Performance Considerations
- Keep middleware logic lightweight and fast
- Cache authentication checks where possible
- Avoid heavy database queries in middleware
- Consider using edge runtime for optimal performance

## Best Practices

1. **Centralized Protection**: All route protection logic should live in `middleware.ts`, not scattered across page components
2. **Consistent Redirects**: Unauthenticated users should always redirect to the same login page
3. **Return URLs**: Consider preserving the intended destination URL to redirect users after login
4. **Layout Usage**: Use dashboard layout (`app/dashboard/layout.tsx`) for shared UI elements across all dashboard pages
5. **Error Handling**: Gracefully handle authentication errors and edge cases in middleware

## Testing

When testing routing:
- Verify unauthenticated users cannot access `/dashboard` routes
- Test that authenticated users can navigate freely within `/dashboard`
- Ensure redirects work correctly
- Test dynamic routes with various parameter values
- Verify middleware doesn't block static assets or API routes unintentionally
