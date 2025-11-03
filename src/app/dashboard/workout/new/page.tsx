import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { WorkoutForm } from './workout-form';

export default async function NewWorkoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <WorkoutForm />
    </div>
  );
}
