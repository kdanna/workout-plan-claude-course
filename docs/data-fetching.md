# Data Fetching Guidelines

## CRITICAL: Server Components Only

**ALL data fetching in this application MUST be done via Server Components.**

### ✅ Allowed Data Fetching Methods
- **Server Components** - The ONLY approved method for data fetching

### ❌ Prohibited Data Fetching Methods
- Route Handlers (API routes)
- Client Components (`"use client"`)
- Server Actions (for data fetching - they can be used for mutations)
- Any other method not explicitly listed as allowed

## Database Queries

### Helper Functions in `/data` Directory

All database queries MUST be performed through helper functions located in the `/data` directory.

**Requirements:**
1. **Location**: All database helper functions must be in `/data` directory
2. **ORM**: Must use Drizzle ORM - **NO RAW SQL ALLOWED**
3. **Security**: Functions must enforce user-level data isolation

### Example Structure

```typescript
// /data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Fetches workouts for a specific user only.
 * CRITICAL: Always filter by userId to ensure data isolation.
 */
export async function getUserWorkouts(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

/**
 * Fetches a single workout for a specific user.
 * CRITICAL: Must verify both workout ID and user ID match.
 */
export async function getUserWorkout(workoutId: string, userId: string) {
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  return result[0] || null;
}
```

### Usage in Server Components

```typescript
// app/workouts/page.tsx
import { getUserWorkouts } from '@/data/workouts';
import { auth } from '@/auth'; // or your auth solution

export default async function WorkoutsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Data fetching happens directly in the Server Component
  const workouts = await getUserWorkouts(session.user.id);

  return (
    <div>
      <h1>My Workouts</h1>
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

## Security: User Data Isolation

### CRITICAL SECURITY RULE

**A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.**

### Enforcement Checklist

Every data helper function MUST:

1. ✅ Accept `userId` as a parameter
2. ✅ Include `userId` in the WHERE clause of every query
3. ✅ Use Drizzle ORM's type-safe query builder
4. ✅ Never use raw SQL queries
5. ✅ Verify user ownership before updates/deletes

### Examples of Correct Implementation

```typescript
// ✅ CORRECT - Always filters by userId
export async function getUserExercises(userId: string) {
  return await db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, userId));
}

// ✅ CORRECT - Verifies ownership before update
export async function updateUserWorkout(
  workoutId: string,
  userId: string,
  data: Partial<Workout>
) {
  return await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    );
}

// ✅ CORRECT - Verifies ownership before delete
export async function deleteUserWorkout(workoutId: string, userId: string) {
  return await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    );
}
```

### Examples of INCORRECT Implementation

```typescript
// ❌ WRONG - No userId filter (security vulnerability!)
export async function getAllWorkouts() {
  return await db.select().from(workouts);
}

// ❌ WRONG - Using raw SQL
export async function getUserWorkouts(userId: string) {
  return await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);
}

// ❌ WRONG - Fetching in a Client Component
"use client";
export function WorkoutsList() {
  const [workouts, setWorkouts] = useState([]);
  useEffect(() => {
    // This is prohibited!
    fetch('/api/workouts').then(r => r.json()).then(setWorkouts);
  }, []);
}

// ❌ WRONG - Using Route Handler for data fetching
// app/api/workouts/route.ts
export async function GET() {
  const workouts = await db.select().from(workouts);
  return Response.json(workouts);
}
```

## Why Server Components?

1. **Security**: Data fetching logic runs on the server with direct database access
2. **Performance**: No client-side JavaScript needed for data fetching
3. **SEO**: Content is rendered on the server and available to crawlers
4. **Type Safety**: Full TypeScript support from database to component
5. **Simplicity**: No need for API routes, fetch calls, or loading states

## Summary

- ✅ **DO**: Fetch data in Server Components
- ✅ **DO**: Use helper functions in `/data` directory
- ✅ **DO**: Use Drizzle ORM for all queries
- ✅ **DO**: Always filter by `userId`
- ❌ **DON'T**: Fetch data in Client Components
- ❌ **DON'T**: Use Route Handlers for data fetching
- ❌ **DON'T**: Write raw SQL queries
- ❌ **DON'T**: Allow access to other users' data
