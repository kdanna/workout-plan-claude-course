# Server Components - Coding Standards

## Critical: Next.js 15+ Async Route Parameters

**In Next.js 15 and later, route parameters (`params`) and search parameters (`searchParams`) are Promises and MUST be awaited.**

This is a breaking change from Next.js 14 and earlier versions. Failing to await these values will result in runtime errors.

## Route Parameters (params)

### ✅ Correct Usage

```typescript
// app/dashboard/workout/[workoutId]/page.tsx

type Props = {
  params: Promise<{ workoutId: string }>;
};

export default async function WorkoutPage({ params }: Props) {
  // MUST await params
  const { workoutId } = await params;

  // Now you can use workoutId safely
  const workout = await getWorkout(workoutId);

  return <div>Workout ID: {workoutId}</div>;
}
```

### ❌ Incorrect Usage

```typescript
// ❌ DO NOT DO THIS - params is NOT directly destructurable
type Props = {
  params: { workoutId: string }; // Wrong type!
};

export default async function WorkoutPage({ params }: Props) {
  const { workoutId } = params; // ❌ Runtime error! params is a Promise
  return <div>Workout ID: {workoutId}</div>;
}
```

```typescript
// ❌ DO NOT DO THIS - accessing property without await
export default async function WorkoutPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const workoutId = params.workoutId; // ❌ Wrong! params is a Promise
  return <div>Workout ID: {workoutId}</div>;
}
```

## Search Parameters (searchParams)

### ✅ Correct Usage

```typescript
// app/dashboard/page.tsx

type Props = {
  searchParams: Promise<{ filter?: string; sort?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  // MUST await searchParams
  const { filter, sort } = await searchParams;

  const workouts = await getWorkouts({ filter, sort });

  return <div>Workouts filtered by: {filter}</div>;
}
```

### ❌ Incorrect Usage

```typescript
// ❌ DO NOT DO THIS
export default async function DashboardPage({
  searchParams
}: {
  searchParams: { filter?: string } // Wrong type!
}) {
  const filter = searchParams.filter; // ❌ Runtime error!
  return <div>Filter: {filter}</div>;
}
```

## Both params and searchParams

```typescript
// app/workout/[id]/edit/page.tsx

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function EditWorkoutPage({ params, searchParams }: Props) {
  // Await both - can be done in parallel
  const [{ id }, { mode }] = await Promise.all([params, searchParams]);

  // Or await sequentially if preferred
  // const { id } = await params;
  // const { mode } = await searchParams;

  return (
    <div>
      Editing workout {id} in {mode || 'default'} mode
    </div>
  );
}
```

## generateMetadata

Metadata functions also receive params and searchParams as Promises:

### ✅ Correct Usage

```typescript
import { Metadata } from 'next';

type Props = {
  params: Promise<{ workoutId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // MUST await params
  const { workoutId } = await params;

  const workout = await getWorkout(workoutId);

  return {
    title: `${workout.name} | Workout Plan`,
    description: workout.description,
  };
}
```

## generateStaticParams

When using `generateStaticParams`, the function itself doesn't receive params as a prop, but the page component still must await params:

```typescript
// Generate static paths
export async function generateStaticParams() {
  const workouts = await getWorkouts();

  return workouts.map((workout) => ({
    workoutId: workout.id,
  }));
}

// Page component still awaits params
export default async function WorkoutPage({
  params
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params;
  // ... rest of component
}
```

## Best Practices

### 1. Always Use Async Page Components
```typescript
// ✅ Make your page component async
export default async function Page({ params }: Props) {
  const { id } = await params;
  // ...
}
```

### 2. Proper TypeScript Types
```typescript
// ✅ Always type params as Promise
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
```

### 3. Await Early
```typescript
// ✅ Await params at the top of your component
export default async function Page({ params }: Props) {
  const { id } = await params; // Await immediately

  // Now use id safely throughout the component
  const data = await fetchData(id);
  const relatedData = await fetchRelated(id);

  return <div>{data.name}</div>;
}
```

### 4. Parallel Awaits When Possible
```typescript
// ✅ If you need both params and searchParams, await in parallel
export default async function Page({ params, searchParams }: Props) {
  const [{ id }, { filter }] = await Promise.all([params, searchParams]);
  // ...
}
```

## Common Errors and Solutions

### Error: "Cannot read property 'x' of undefined"
**Cause:** Trying to access params properties without awaiting

**Solution:**
```typescript
// ❌ Before
const { id } = params;

// ✅ After
const { id } = await params;
```

### Error: "params.then is not a function" in type errors
**Cause:** Incorrect TypeScript type for params

**Solution:**
```typescript
// ❌ Before
type Props = { params: { id: string } };

// ✅ After
type Props = { params: Promise<{ id: string }> };
```

## Migration from Next.js 14

If upgrading from Next.js 14, you'll need to update all dynamic routes:

```typescript
// Next.js 14 (old)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <div>{id}</div>;
}

// Next.js 15+ (new)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

## Why This Change?

Next.js 15 made this change to better support:
- Partial Prerendering (PPR)
- Improved performance optimizations
- Better streaming and suspense boundaries
- More predictable async behavior

## Summary Checklist

When creating or updating server components with dynamic routes:

- [ ] Mark page component as `async`
- [ ] Type `params` as `Promise<{ ... }>`
- [ ] Type `searchParams` as `Promise<{ ... }>`
- [ ] `await params` before accessing properties
- [ ] `await searchParams` before accessing properties
- [ ] Apply same rules to `generateMetadata` functions
- [ ] Update all dynamic route segments in your app

---

**Remember: In Next.js 15+, always await `params` and `searchParams` - they are Promises, not plain objects!**
