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
        'relative overflow-hidden rounded-2xl border-2 border-gray-900 bg-gradient-to-br from-pink-50 to-cyan-50 shadow-pop',
        className
      )}
      {...props}
    />
  );
}
