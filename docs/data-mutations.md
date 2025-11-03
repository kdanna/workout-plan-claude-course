# Data Mutations Guidelines

This document outlines the mandatory standards for all data mutations (inserts, updates, deletes) in the workout plan application. **All contributors must strictly adhere to these guidelines.**

---

## CRITICAL: Three-Layer Architecture

**ALL data mutations MUST follow this exact three-layer architecture:**

1. **Server Actions** (in colocated `actions.ts` files) - Entry point with validation
2. **Helper Functions** (in `src/data` directory) - Business logic wrapper
3. **Drizzle ORM** - Database operations

### ✅ Allowed Data Mutation Methods
- **Server Actions** with Zod validation calling helper functions in `src/data`

### ❌ Prohibited Data Mutation Methods
- Route Handlers (API routes)
- Client-side mutations
- Direct database calls from Server Actions
- Server Actions without Zod validation
- Raw SQL queries

---

## Layer 1: Server Actions

### File Organization

All Server Actions MUST be in colocated `actions.ts` files within the relevant app directory.

**File naming convention:** `actions.ts` (lowercase, plural)

```
app/
  workouts/
    page.tsx
    actions.ts          ← Server Actions for workouts
  exercises/
    page.tsx
    actions.ts          ← Server Actions for exercises
  profile/
    page.tsx
    actions.ts          ← Server Actions for profile
```

### Server Action Rules

Every Server Action MUST:

1. ✅ Use the `"use server"` directive at the top of the file
2. ✅ Have typed parameters (NOT `FormData`)
3. ✅ Validate ALL input parameters using Zod
4. ✅ Call helper functions from `src/data` directory
5. ✅ Handle authentication/authorization
6. ✅ Return structured results (success/error states)
7. ✅ Use `revalidatePath()` or `revalidateTag()` when needed
8. ❌ **NEVER use `redirect()` within Server Actions** - redirects should be handled client-side after the Server Action resolves

### Server Action Template

```typescript
// app/workouts/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createWorkout, updateWorkout, deleteWorkout } from "@/src/data/workouts";

// Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  scheduledDate: z.date(),
});

const updateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scheduledDate: z.date().optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.string().uuid(),
});

// Server Action for creating a workout
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // 1. Validate input
  const validatedData = createWorkoutSchema.parse(input);

  // 2. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 3. Call helper function from src/data
    const workout = await createWorkout({
      ...validatedData,
      userId: session.user.id,
    });

    // 4. Revalidate cache
    revalidatePath("/workouts");

    // 5. Return success
    return { success: true, data: workout };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return { success: false, error: "Failed to create workout" };
  }
}

// Server Action for updating a workout
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  const validatedData = updateWorkoutSchema.parse(input);

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const workout = await updateWorkout(
      validatedData.id,
      session.user.id,
      validatedData
    );

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    revalidatePath("/workouts");
    revalidatePath(`/workouts/${validatedData.id}`);

    return { success: true, data: workout };
  } catch (error) {
    console.error("Failed to update workout:", error);
    return { success: false, error: "Failed to update workout" };
  }
}

// Server Action for deleting a workout
export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  const validatedData = deleteWorkoutSchema.parse(input);

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await deleteWorkout(validatedData.id, session.user.id);

    revalidatePath("/workouts");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete workout:", error);
    return { success: false, error: "Failed to delete workout" };
  }
}
```

### Using Server Actions in Components

```typescript
// app/workouts/create-workout-form.tsx
"use client";

import { createWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";

export function CreateWorkoutForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createWorkoutAction({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        scheduledDate: new Date(formData.get("date") as string),
      });

      if (result.success) {
        // Handle success (e.g., show toast, reset form)
        console.log("Workout created:", result.data);
      } else {
        // Handle error (e.g., show error message)
        console.error("Error:", result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" placeholder="Workout name" required />
      <Input name="description" placeholder="Description" />
      <Input name="date" type="date" required />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>
    </form>
  );
}
```

---

## Layer 2: Helper Functions in `src/data`

### Directory Structure

All database helper functions MUST be in the `src/data` directory.

```
src/
  data/
    workouts.ts         ← Workout-related database operations
    exercises.ts        ← Exercise-related database operations
    users.ts           ← User-related database operations
```

### Helper Function Rules

Every helper function MUST:

1. ✅ Be located in `src/data` directory
2. ✅ Use Drizzle ORM exclusively (NO RAW SQL)
3. ✅ Accept `userId` parameter for user-specific operations
4. ✅ Enforce user data isolation (filter by `userId`)
5. ✅ Return typed results
6. ✅ Handle errors appropriately

### Helper Function Examples

```typescript
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Creates a new workout for a user.
 * CRITICAL: Always include userId to ensure data isolation.
 */
export async function createWorkout(data: {
  name: string;
  description?: string;
  scheduledDate: Date;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      name: data.name,
      description: data.description,
      scheduledDate: data.scheduledDate,
      userId: data.userId,
    })
    .returning();

  return workout;
}

/**
 * Updates a workout for a specific user.
 * CRITICAL: Must verify both workout ID and user ID match.
 */
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    scheduledDate?: Date;
  }
) {
  const [workout] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return workout;
}

/**
 * Deletes a workout for a specific user.
 * CRITICAL: Must verify both workout ID and user ID match.
 */
export async function deleteWorkout(workoutId: string, userId: string) {
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    );
}

/**
 * Adds an exercise to a workout.
 * CRITICAL: Must verify workout ownership before allowing the operation.
 */
export async function addExerciseToWorkout(
  workoutId: string,
  userId: string,
  exerciseData: {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }
) {
  // First verify the workout belongs to the user
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  if (!workout.length) {
    throw new Error("Workout not found or access denied");
  }

  // Now insert the exercise
  const [exercise] = await db
    .insert(exercises)
    .values({
      ...exerciseData,
      workoutId,
      userId, // Also store userId for additional security
    })
    .returning();

  return exercise;
}
```

---

## Layer 3: Drizzle ORM

### Rules

1. ✅ **ONLY use Drizzle ORM** for database operations
2. ❌ **ABSOLUTELY NO raw SQL queries**
3. ✅ Use Drizzle's type-safe query builder
4. ✅ Use Drizzle's operators (`eq`, `and`, `or`, etc.)
5. ✅ Always use `.returning()` for insert/update operations when you need the result

### Common Drizzle Patterns

```typescript
import { db } from "@/db";
import { workouts, exercises } from "@/db/schema";
import { eq, and, or, desc, asc } from "drizzle-orm";

// INSERT
const [newWorkout] = await db
  .insert(workouts)
  .values({ name: "Leg Day", userId: "123" })
  .returning();

// UPDATE
const [updatedWorkout] = await db
  .update(workouts)
  .set({ name: "New Leg Day" })
  .where(eq(workouts.id, workoutId))
  .returning();

// DELETE
await db
  .delete(workouts)
  .where(eq(workouts.id, workoutId));

// Multiple conditions with AND
await db
  .update(workouts)
  .set({ completed: true })
  .where(
    and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    )
  );

// Multiple conditions with OR
await db
  .select()
  .from(workouts)
  .where(
    or(
      eq(workouts.status, "active"),
      eq(workouts.status, "scheduled")
    )
  );
```

---

## Security: User Data Isolation

### CRITICAL SECURITY RULE

**A logged-in user can ONLY mutate their own data. They MUST NOT be able to modify any other user's data.**

### Security Enforcement Checklist

Every data mutation MUST:

1. ✅ Verify user authentication in Server Action
2. ✅ Pass `userId` to helper function
3. ✅ Include `userId` in WHERE clause for updates/deletes
4. ✅ Verify ownership before mutations
5. ✅ Use Drizzle ORM's type-safe queries

### Security Examples

```typescript
// ✅ CORRECT - Verifies authentication and ownership
export async function updateWorkoutAction(input: UpdateInput) {
  const validatedData = schema.parse(input);

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Helper function will verify userId matches
  const workout = await updateWorkout(
    validatedData.id,
    session.user.id,  // ← User can only update their own data
    validatedData
  );

  return { success: true, data: workout };
}

// ✅ CORRECT - Helper enforces ownership
export async function deleteWorkout(workoutId: string, userId: string) {
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)  // ← Must match both conditions
      )
    );
}

// ❌ WRONG - No userId check (security vulnerability!)
export async function deleteWorkout(workoutId: string) {
  await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId));  // ← Any user could delete any workout!
}

// ❌ WRONG - No authentication check
export async function updateWorkoutAction(input: UpdateInput) {
  const validatedData = schema.parse(input);

  // Missing auth check!
  const workout = await updateWorkout(validatedData);

  return { success: true, data: workout };
}
```

---

## Zod Validation

### Rules

1. ✅ **EVERY Server Action MUST validate its input with Zod**
2. ✅ Define schemas at the top of the `actions.ts` file
3. ✅ Use `.parse()` to validate and throw on error
4. ✅ Use `.safeParse()` if you want to handle errors manually
5. ✅ Define reusable schemas for common patterns

### Zod Schema Examples

```typescript
import { z } from "zod";

// Basic schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
  scheduledDate: z.date(),
});

// Schema with enums
const workoutStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "in-progress", "completed", "skipped"]),
});

// Schema with nested objects
const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(100),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  restTime: z.number().int().min(0).max(600).optional(),
});

// Schema with array validation
const bulkCreateExercisesSchema = z.object({
  workoutId: z.string().uuid(),
  exercises: z.array(createExerciseSchema).min(1).max(20),
});

// Schema with refinement
const updateWorkoutDateSchema = z.object({
  id: z.string().uuid(),
  scheduledDate: z.date(),
}).refine(
  (data) => data.scheduledDate >= new Date(),
  { message: "Scheduled date must be in the future" }
);

// Using schemas in Server Actions
export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  // Throws ZodError if validation fails
  const validatedData = createWorkoutSchema.parse(input);

  // ... rest of action
}

// Manual error handling with safeParse
export async function createWorkoutAction(
  input: unknown
) {
  const result = createWorkoutSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      details: result.error.flatten()
    };
  }

  const validatedData = result.data;
  // ... rest of action
}
```

---

## Navigation and Redirects

### CRITICAL RULE: No `redirect()` in Server Actions

**Server Actions MUST NOT use Next.js `redirect()` function.** All navigation and redirects must be handled client-side after the Server Action resolves.

### Why This Rule Exists

1. **Better Error Handling:** Client-side redirects allow proper error handling before navigation
2. **User Feedback:** Enables showing loading states, success messages, or errors before redirecting
3. **Predictable Behavior:** Server-side redirects can be confusing and harder to debug
4. **Progressive Enhancement:** Maintains control flow in the client component

### Redirect Pattern

```typescript
// ❌ WRONG - Using redirect() in Server Action
"use server";

import { redirect } from "next/navigation";

export async function createWorkoutAction(input: CreateInput) {
  const validatedData = schema.parse(input);
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in"); // ❌ DON'T DO THIS
  }

  const workout = await createWorkout({ ...validatedData, userId: session.user.id });

  revalidatePath("/workouts");
  redirect("/workouts"); // ❌ DON'T DO THIS
}

// ✅ CORRECT - Return success, handle redirect client-side
"use server";

export async function createWorkoutAction(input: CreateInput) {
  const validatedData = schema.parse(input);
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }; // ✅ Return error
  }

  try {
    const workout = await createWorkout({ ...validatedData, userId: session.user.id });
    revalidatePath("/workouts");
    return { success: true, data: workout }; // ✅ Return success
  } catch (error) {
    return { success: false, error: "Failed to create workout" };
  }
}
```

### Client-Side Redirect Handling

```typescript
// Client Component
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CreateWorkoutForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createWorkoutAction({
        name: formData.get("name") as string,
        date: formData.get("date") as string,
      });

      if (result.success) {
        // ✅ Handle redirect client-side
        router.push("/workouts");
        // Could also show a success toast here
      } else {
        // ✅ Handle error without redirecting
        setError(result.error);
      }
    });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Alternative Navigation Patterns

```typescript
// Pattern 1: Redirect with success message
if (result.success) {
  toast.success("Workout created!");
  router.push("/workouts");
}

// Pattern 2: Redirect to specific item
if (result.success) {
  router.push(`/workouts/${result.data.id}`);
}

// Pattern 3: Stay on page and reset form
if (result.success) {
  toast.success("Workout created!");
  form.reset();
  // Don't redirect, let user create another
}

// Pattern 4: Conditional redirect based on user choice
if (result.success) {
  if (shouldAddExercises) {
    router.push(`/workouts/${result.data.id}/exercises`);
  } else {
    router.push("/workouts");
  }
}
```

---

## Complete Example: End-to-End Flow

### 1. Database Schema (Drizzle)

```typescript
// db/schema.ts
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: integer("weight"),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2. Helper Functions

```typescript
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createWorkout(data: {
  name: string;
  description?: string;
  scheduledDate: Date;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values(data)
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string;
    scheduledDate: Date;
  }>
) {
  const [workout] = await db
    .update(workouts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return workout;
}
```

### 3. Server Actions

```typescript
// app/workouts/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createWorkout, updateWorkout } from "@/src/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scheduledDate: z.date(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  const validatedData = createWorkoutSchema.parse(input);

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const workout = await createWorkout({
      ...validatedData,
      userId: session.user.id,
    });

    revalidatePath("/workouts");

    return { success: true, data: workout };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return { success: false, error: "Failed to create workout" };
  }
}
```

### 4. Client Component

```typescript
// app/workouts/create-workout-form.tsx
"use client";

import { createWorkoutAction } from "./actions";
import { useTransition } from "react";

export function CreateWorkoutForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createWorkoutAction({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        scheduledDate: new Date(formData.get("date") as string),
      });

      if (!result.success) {
        alert(result.error);
      }
    });
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

---

## Enforcement

These standards are **non-negotiable**. Code reviews should reject:

- ❌ Server Actions without Zod validation
- ❌ Server Actions with `FormData` parameters
- ❌ Direct database calls from Server Actions
- ❌ Helper functions outside `src/data` directory
- ❌ Raw SQL queries
- ❌ Missing `userId` checks for user data
- ❌ Server Actions not in `actions.ts` files
- ❌ Route Handlers for mutations
- ❌ Using `redirect()` within Server Actions

All mutations must:

- ✅ Use Server Actions in colocated `actions.ts` files
- ✅ Validate all input with Zod schemas
- ✅ Use typed parameters (not FormData)
- ✅ Call helper functions in `src/data`
- ✅ Use Drizzle ORM exclusively
- ✅ Enforce user data isolation
- ✅ Return structured results
- ✅ Handle redirects client-side after Server Action completes

---

## Summary

### Three-Layer Architecture

1. **Server Actions** (`app/*/actions.ts`)
   - Validate with Zod
   - Check authentication
   - Call helper functions
   - Return structured results

2. **Helper Functions** (`src/data/*.ts`)
   - Use Drizzle ORM only
   - Enforce user data isolation
   - Handle business logic

3. **Drizzle ORM**
   - Type-safe queries
   - No raw SQL
   - Proper error handling

### Key Rules

- ✅ Zod validation for ALL Server Actions
- ✅ Typed parameters (NOT FormData)
- ✅ Helper functions in `src/data`
- ✅ Drizzle ORM exclusively
- ✅ User data isolation
- ❌ No raw SQL
- ❌ No Route Handlers
- ❌ No direct DB calls from actions
