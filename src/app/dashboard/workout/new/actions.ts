"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";

// Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000, "Notes too long").optional(),
});

// Server Action for creating a workout
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // 1. Validate input
  const validatedData = createWorkoutSchema.parse(input);

  // 2. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 3. Parse date string to Date object
    const workoutDate = new Date(validatedData.date + 'T00:00:00');

    // 4. Call helper function from src/data
    const workout = await createWorkout({
      name: validatedData.name,
      date: workoutDate,
      notes: validatedData.notes,
      userId,
    });

    // 5. Revalidate cache
    revalidatePath("/dashboard");

    // 6. Return success and redirect to dashboard
    return { success: true, data: workout };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return { success: false, error: "Failed to create workout" };
  }
}
