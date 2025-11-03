"use client";

import { updateWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

interface Workout {
  id: number;
  name: string;
  date: Date;
  notes: string | null;
}

interface WorkoutFormProps {
  workout: Workout;
}

export function WorkoutForm({ workout }: WorkoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateWorkoutAction({
        id: workout.id,
        name: formData.get("name") as string,
        date: formData.get("date") as string,
        notes: formData.get("notes") as string,
      });

      if (result.success) {
        // Redirect to dashboard on success
        router.push("/dashboard");
      } else {
        // Handle error (e.g., show error message)
        setError(result.error || "Failed to update workout");
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Workout</CardTitle>
        <CardDescription>Update your workout details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Upper Body Strength"
              defaultValue={workout.name}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={formatDateForInput(workout.date)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this workout..."
              defaultValue={workout.notes || ""}
              rows={4}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
