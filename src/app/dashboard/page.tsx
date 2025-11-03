import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserWorkoutsByDate } from '@/data/workouts';
import DashboardClient from './dashboard-client';

type SearchParams = Promise<{ date?: string }>;

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Parse date from URL or default to today
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  // Parse date in local timezone by adding T00:00:00 to prevent UTC conversion
  const selectedDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();

  // Fetch workouts for the selected date from Server Component
  const workouts = await getUserWorkoutsByDate(userId, selectedDate);

  return <DashboardClient workouts={workouts} selectedDate={selectedDate} />;
}
