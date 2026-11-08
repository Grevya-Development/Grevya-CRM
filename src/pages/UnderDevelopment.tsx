import { Header } from '@/components/layout/Header';
import { Construction } from 'lucide-react';

interface UnderDevelopmentProps {
  title: string;
  subtitle?: string;
}

export default function UnderDevelopment({ title, subtitle }: UnderDevelopmentProps) {
  return (
    <div className="min-h-screen">
      <Header title={title} subtitle={subtitle} />
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="rounded-full bg-amber-100 p-6 mb-6">
          <Construction className="h-16 w-16 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Under Development</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This page is currently under development. Please check back later for updates.
        </p>
      </div>
    </div>
  );
}
