import { Header } from '@/components/layout/Header';

export default function Forecast() {
  return (
    <div className="min-h-screen">
      <Header title="Forecast" showAddButton={false} />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Forecast Configuration</h2>
          <p className="text-muted-foreground">
            Configure your sales forecast settings and parameters here.
          </p>
        </div>
      </div>
    </div>
  );
}
