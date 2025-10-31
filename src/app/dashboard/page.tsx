'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatStandardDate } from '@/lib/date-utils';

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: 1,
    name: 'Morning Strength Training',
    exercises: ['Bench Press', 'Squats', 'Deadlifts'],
    duration: '45 mins',
    completed: true,
  },
  {
    id: 2,
    name: 'Cardio Session',
    exercises: ['Running', 'Jump Rope'],
    duration: '30 mins',
    completed: false,
  },
  {
    id: 3,
    name: 'Upper Body Focus',
    exercises: ['Pull-ups', 'Shoulder Press', 'Bicep Curls'],
    duration: '40 mins',
    completed: true,
  },
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
                onSelect={(date) => date && setSelectedDate(date)}
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
                {mockWorkouts.length} workout{mockWorkouts.length !== 1 ? 's' : ''} logged
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWorkouts.length > 0 ? (
                  mockWorkouts.map((workout) => (
                    <Card key={workout.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{workout.name}</CardTitle>
                            <CardDescription>
                              Duration: {workout.duration}
                            </CardDescription>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              workout.completed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {workout.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Exercises:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {workout.exercises.map((exercise, index) => (
                              <li key={index}>{exercise}</li>
                            ))}
                          </ul>
                        </div>
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
                    <Button>Log New Workout</Button>
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
