'use client';

import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatStandardDate } from '@/lib/date-utils';

type Workout = {
  id: number;
  userId: string;
  name: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  workouts: Workout[];
  selectedDate: Date;
};

export default function DashboardClient({ workouts, selectedDate }: Props) {
  const router = useRouter();

  // Handle date selection by updating URL
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Format date as YYYY-MM-DD for URL
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Navigate to URL with date param - triggers server-side data fetch
    router.push(`/dashboard?date=${dateString}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Workout Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Date Picker Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                {formatStandardDate(selectedDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Workouts List Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Workouts for {formatStandardDate(selectedDate)}</CardTitle>
              <CardDescription>
                {workouts.length} workout{workouts.length !== 1 ? 's' : ''} logged
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workouts.length > 0 ? (
                  workouts.map((workout) => (
                    <Card key={workout.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{workout.name}</CardTitle>
                            <CardDescription>
                              {new Date(workout.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {workout.notes && (
                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-muted-foreground">{workout.notes}</p>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      No workouts logged for this date
                    </p>
                    <Button onClick={() => router.push('/dashboard/workout/new')}>Log New Workout</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
