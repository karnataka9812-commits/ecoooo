import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'ivory';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3A36C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101C17] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[#788B68] text-[#101C17] hover:bg-[#899D78] font-semibold',
    ivory: 'bg-[#EEEBDD] text-[#101C17] hover:bg-[#D5D9C6] font-semibold',
    secondary:
      'bg-[var(--app-surface-elevated)] text-[var(--app-text)] border border-[var(--app-border-strong)] hover:border-[var(--app-text-muted)]',
    ghost:
      'bg-transparent text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-elevated)]/60 hover:text-[var(--app-text)]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3.5 py-2 text-xs min-h-[36px]',
    md: 'px-5 py-2.5 text-sm min-h-[42px]',
    lg: 'px-6 py-3 text-sm min-h-[46px]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface SurfacePanelProps {
  children: React.ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}

export function SurfacePanel({
  children,
  className = '',
  as: Component = 'div',
}: SurfacePanelProps) {
  return (
    <Component
      className={`bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg ${className}`}
    >
      {children}
    </Component>
  );
}

interface MetricReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  accent?: 'default' | 'moss' | 'amber';
}

export function MetricReadout({
  label,
  value,
  unit,
  context,
  accent = 'default',
}: MetricReadoutProps) {
  const valueColor =
    accent === 'amber'
      ? 'text-[#D3A36C]'
      : accent === 'moss'
        ? 'text-[#788B68]'
        : 'text-[var(--app-text)]';

  return (
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg p-5 flex flex-col justify-between">
      <div className="text-xs font-medium tracking-wide text-[var(--app-text-muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl sm:text-3xl font-mono font-medium tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-[var(--app-text-muted)]">{unit}</span>
        )}
      </div>
      {context && (
        <div className="mt-2 text-xs text-[var(--app-text-muted)] leading-relaxed">{context}</div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-[var(--app-border-strong)] rounded-lg p-10 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-[var(--app-surface-elevated)] flex items-center justify-center text-[var(--app-text-muted)] mb-4">
        {icon ?? <Leaf className="w-5 h-5" />}
      </div>
      <h3 className="text-base font-medium text-[var(--app-text)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--app-text-muted)] max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function SkeletonPanel({ className = 'h-32' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg ${className}`}
    />
  );
}

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function MediaImage({ src, alt, className = '', fallbackLabel }: MediaImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-[#18271F] via-[#243B2E] to-[#101C17] flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <Leaf className="w-7 h-7 text-[#788B68] mb-2 opacity-80" />
        <span className="text-xs text-[#D5D9C6]/80 font-medium">
          {fallbackLabel ?? alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
