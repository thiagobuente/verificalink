import { Spinner } from '@/components/base';

export function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <Spinner label="Loading Shield Security Scanner" />
    </div>
  );
}
