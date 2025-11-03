import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { WorkoutForm } from './workout-form';
import { getUserWorkout } from '@/data/workouts';

interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function EditWorkoutPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Await the params to get the workoutId
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    redirect('/dashboard');
  }

  // Fetch the workout data from the database
  const workout = await getUserWorkout(workoutIdNum, userId);

  if (!workout) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <WorkoutForm workout={workout} />
    </div>
  );
}
