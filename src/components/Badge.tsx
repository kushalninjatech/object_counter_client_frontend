import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge',
        variant === 'success' && 'badge-success',
        variant === 'warning' && 'badge-warning',
        variant === 'danger' && 'badge-danger',
        variant === 'info' && 'badge-info',
        variant === 'default' && 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {children}
    </span>
  );
}
