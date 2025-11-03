"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { updateWorkout } from "@/data/workouts";

// Zod schema for validation
const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000, "Notes too long").optional(),
});

// Server Action for updating a workout
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  // 1. Validate input
  const validatedData = updateWorkoutSchema.parse(input);

  // 2. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 3. Parse date string to Date object
    const workoutDate = new Date(validatedData.date + 'T00:00:00');

    // 4. Call helper function from src/data
    const workout = await updateWorkout(
      validatedData.id,
      userId,
      {
        name: validatedData.name,
        date: workoutDate,
        notes: validatedData.notes,
      }
    );

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    // 5. Revalidate cache
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${validatedData.id}`);

    // 6. Return success
    return { success: true, data: workout };
  } catch (error) {
    console.error("Failed to update workout:", error);
    return { success: false, error: "Failed to update workout" };
  }
}
