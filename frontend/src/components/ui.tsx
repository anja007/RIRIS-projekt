import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { STATUS_LABELS } from '../format';

type Variant = 'default' | 'primary' | 'danger' | 'ok' | 'ghost';

/** Gumb v slogu iz index.css (.btn, .btn-primary ...). */
export function Button({
  variant = 'default',
  small = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  const variantClass = variant === 'default' ? '' : `btn-${variant}`;
  return <button className={`btn ${variantClass} ${small ? 'btn-sm' : ''} ${className}`} {...props} />;
}

export function Field({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        aria-invalid={error ? true : undefined}
        style={error ? { borderColor: 'var(--bad)' } : undefined}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-bad">{error}</span>}
      {!error && hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

/** Okvir, kot »box« v wireframih. */
export function Panel({
  title,
  step,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode;
  step?: number;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-xl">
            {step !== undefined && <span className="step-num">{step}</span>}
            {title}
          </h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Alert({ kind = 'bad', children }: { kind?: 'bad' | 'ok' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert-${kind}`} role={kind === 'bad' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/** Črtkano pojasnilo, kot opombe v wireframih. */
export function Note({ children }: { children: ReactNode }) {
  return <div className="note">{children}</div>;
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-4xl">{children}</h1>
      {actions}
    </div>
  );
}

export type Message = { kind: 'bad' | 'ok'; text: string } | null;
