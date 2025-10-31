import { integer, pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

// Exercise library for predefined exercises
export const exerciseLibrary = pgTable("exercise_library", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  muscleGroup: varchar({ length: 100 }),
  createdAt: timestamp().notNull().defaultNow(),
});

// Workouts table - user's workout sessions
export const workouts = pgTable("workouts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  date: timestamp().notNull(),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("userId_idx").on(table.userId),
]);

// Exercises within a workout
export const exercises = pgTable("exercises", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  workoutId: integer().notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseLibraryId: integer().references(() => exerciseLibrary.id),
  name: varchar({ length: 255 }).notNull(),
  order: integer().notNull(),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("workoutId_idx").on(table.workoutId),
]);

// Sets for each exercise
export const sets = pgTable("sets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  exerciseId: integer().notNull().references(() => exercises.id, { onDelete: "cascade" }),
  setNumber: integer().notNull(),
  reps: integer().notNull(),
  weight: integer(), // Weight in lbs, nullable for bodyweight exercises
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("exerciseId_idx").on(table.exerciseId),
]);

