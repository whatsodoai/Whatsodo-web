import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...props} />;
}

export function StatCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('stat-card', className)} {...props} />;
}

export function GlowCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-glass',
        className
      )}
      {...props}
    />
  );
}
