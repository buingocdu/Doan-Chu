import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

interface StatusMessageProps {
  kind: 'loading' | 'error' | 'empty';
  children: ReactNode;
  onRetry?: () => void;
}

const ICONS = { loading: Loader2, error: AlertTriangle, empty: Inbox };

export default function StatusMessage({ kind, children, onRetry }: StatusMessageProps) {
  const Icon = ICONS[kind];
  return (
    <div className={`status status-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon size={28} aria-hidden="true" className={kind === 'loading' ? 'spin' : undefined} />
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
