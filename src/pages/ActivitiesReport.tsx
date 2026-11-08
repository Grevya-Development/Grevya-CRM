import { Header } from '@/components/layout/Header';

export default function ActivitiesReport() {
  return (
    <div className="min-h-screen">
      <Header title="Activities Report" showAddButton={false} />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Activities Report</h2>
          <p className="text-muted-foreground">
            View detailed activities reports and analytics here.
          </p>
        </div>
      </div>
    </div>
  );
}
