import { Navigate, createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const today = format(new Date(), 'yyyy-MM-dd');

  return <Navigate to="/day/$date" params={{ date: today }} />;
}
