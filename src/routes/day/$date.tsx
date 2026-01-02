import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useCreateDay, useDayByDate } from '../../lib/hooks';

export const Route = createFileRoute('/day/$date')({
  component: DayView,
});

function DayView() {
  const { date } = Route.useParams();
  const { data: day, isLoading } = useDayByDate(date);
  const createDay = useCreateDay();

  // Auto-create day if it doesn't exist
  if (!isLoading && !day && !createDay.isPending) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    createDay.mutate({ date, timezone });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {formattedDate}
        </h1>
        <p className="text-slate-600 mb-8">Plan your day with time blocks</p>

        {day ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-500">Day ID: {day.id}</p>
            <p className="text-sm text-slate-500">Timezone: {day.timezone}</p>
            <div className="mt-4">
              <p className="text-slate-600">
                Timeline view will be implemented in step 3
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600">Creating day...</p>
          </div>
        )}
      </div>
    </div>
  );
}
