import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/base';

interface ErrorFallbackProps {
  error?: Error | null;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-rose-300" />Unexpected application error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">Shield Security Scanner encountered an unrecoverable UI error. No analysis data was changed.</p>
          {error?.message ? <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-500">{error.message}</pre> : null}
          <Button onClick={onReset}><RotateCcw />Reload application</Button>
        </CardContent>
      </Card>
    </div>
  );
}
