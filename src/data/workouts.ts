import { db } from '@/db';
import { workouts, exercises, sets } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Fetches all workouts for a specific user.
 * CRITICAL: Always filters by userId to ensure data isolation.
 */
export async function getUserWorkouts(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date);
}

/**
 * Fetches workouts for a specific user on a specific date.
 * CRITICAL: Always filters by userId to ensure data isolation.
 */
export async function getUserWorkoutsByDate(userId: string, date: Date) {
  // Set start of day (00:00:00)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Set end of day (23:59:59)
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, startOfDay),
        lte(workouts.date, endOfDay)
      )
    )
    .orderBy(workouts.date);
}

/**
 * Fetches a single workout with all exercises and sets for a specific user.
 * CRITICAL: Must verify both workout ID and user ID match.
 */
export async function getUserWorkoutWithExercises(workoutId: number, userId: string) {
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

  if (!workout[0]) {
    return null;
  }

  // Get exercises for this workout
  const workoutExercises = await db
    .select()
    .from(exercises)
    .where(eq(exercises.workoutId, workoutId))
    .orderBy(exercises.order);

  // Get sets for each exercise
  const exercisesWithSets = await Promise.all(
    workoutExercises.map(async (exercise: typeof exercises.$inferSelect) => {
      const exerciseSets = await db
        .select()
        .from(sets)
        .where(eq(sets.exerciseId, exercise.id))
        .orderBy(sets.setNumber);

      return {
        ...exercise,
        sets: exerciseSets,
      };
    })
  );

  return {
    ...workout[0],
    exercises: exercisesWithSets,
  };
}

/**
 * Creates a new workout for a user.
 * CRITICAL: Always include userId to ensure data isolation.
 */
export async function createWorkout(data: {
  name: string;
  date: Date;
  notes?: string;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      name: data.name,
      date: data.date,
      notes: data.notes,
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
  workoutId: number,
  userId: string,
  data: {
    name?: string;
    date?: Date;
    notes?: string;
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
 * Fetches a single workout for a specific user.
 * CRITICAL: Must verify both workout ID and user ID match.
 */
export async function getUserWorkout(workoutId: number, userId: string) {
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
