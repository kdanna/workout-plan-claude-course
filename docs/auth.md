# Authentication Documentation

This document outlines the authentication approach and coding standards for this application.

## Overview

This application uses **Clerk** for authentication and user management. Clerk provides a complete authentication solution with built-in UI components, session management, and security best practices.

## Core Principles

1. **Clerk is the single source of truth for authentication** - Do not implement custom auth logic
2. **Use Clerk's provided components and hooks** - Leverage pre-built solutions for sign-in, sign-up, and user management
3. **Server-side authentication** - Prefer server-side auth checks using Clerk's Next.js helpers
4. **Protected routes** - Always verify authentication status before rendering protected content

## Installation & Setup

### Required Packages
```bash
npm install @clerk/nextjs
```

### Environment Variables
Add the following to your `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Middleware Configuration
Create `middleware.ts` in the project root to protect routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Root Layout Setup
Wrap your application with `ClerkProvider` in `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## Usage Patterns

### Server Components (Preferred)

For Server Components, use `auth()` and `currentUser()`:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  // Get auth state
  const { userId } = await auth()

  // Or get full user object
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
    </div>
  )
}
```

### Client Components

For Client Components requiring auth state, use hooks:

```typescript
'use client'

import { useUser, useAuth } from '@clerk/nextjs'

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useAuth()

  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return <div>Not signed in</div>

  return (
    <div>
      <p>{user.fullName}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### Pre-built UI Components

Clerk provides ready-to-use UI components:

```typescript
import { SignIn, SignUp, UserButton } from '@clerk/nextjs'

// Sign-in page
export default function SignInPage() {
  return <SignIn />
}

// Sign-up page
export default function SignUpPage() {
  return <SignUp />
}

// User menu button (shows avatar, menu)
export function Header() {
  return (
    <header>
      <UserButton />
    </header>
  )
}
```

### API Routes

Protect API routes using Clerk's auth helpers:

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle authenticated request
  return NextResponse.json({ data: 'Protected data' })
}
```

## Route Organization

### Recommended Structure
```
app/
├── (auth)/
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   └── sign-up/
│       └── [[...sign-up]]/
│           └── page.tsx
├── (protected)/
│   ├── dashboard/
│   │   └── page.tsx
│   └── workouts/
│       └── page.tsx
└── page.tsx (public home)
```

The `[[...sign-in]]` and `[[...sign-up]]` catch-all routes allow Clerk to handle all auth flows.

## Best Practices

### ✅ DO:
- Use `auth()` in Server Components for auth checks
- Use `currentUser()` when you need full user data
- Leverage Clerk's pre-built components (`<SignIn />`, `<SignUp />`, `<UserButton />`)
- Protect routes with middleware
- Check `isLoaded` before rendering auth-dependent UI in Client Components
- Use Clerk's webhooks for syncing user data to your database

### ❌ DON'T:
- Implement custom JWT handling or session management
- Store passwords or sensitive auth data in your database
- Create custom sign-in/sign-up forms unless absolutely necessary
- Mix authentication providers (stick with Clerk exclusively)
- Use client-side only authentication checks for protected pages

## User Metadata

Clerk supports three types of metadata:

```typescript
// Public metadata (readable by anyone)
await user.update({
  publicMetadata: {
    role: 'admin'
  }
})

// Private metadata (only readable by backend)
// Set via Clerk Dashboard or Backend API

// Unsafe metadata (readable/writable by user)
await user.update({
  unsafeMetadata: {
    preferences: { theme: 'dark' }
  }
})
```

**Important:** Never store sensitive data in `publicMetadata` or `unsafeMetadata`.

## Database Integration

When you need to store user-related data:

1. Use Clerk's `userId` as the foreign key
2. Set up Clerk webhooks to sync user creation/updates
3. Never duplicate auth-related data (email, password, etc.)

```typescript
// Example: Workout table referencing Clerk user
interface Workout {
  id: string
  userId: string // Clerk user ID
  name: string
  createdAt: Date
}
```

## Testing

For testing authenticated flows:

```typescript
// Use Clerk's testing tokens
// See: https://clerk.com/docs/testing/overview
```

## Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks/overview)
- [Authentication Best Practices](https://clerk.com/docs/security/overview)

## Security Considerations

1. **Never expose secret keys** - Keep `CLERK_SECRET_KEY` in `.env.local` only
2. **Use middleware for route protection** - Don't rely solely on client-side checks
3. **Validate on the server** - Always verify auth status in API routes and Server Components
4. **HTTPS only in production** - Clerk requires HTTPS for production deployments
5. **Regular key rotation** - Rotate API keys periodically via Clerk Dashboard
