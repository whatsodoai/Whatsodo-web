import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  gray: 'text-gray-700 bg-gray-100',
  green: 'text-green-700 bg-green-100',
  blue: 'text-blue-700 bg-blue-100',
  amber: 'text-amber-700 bg-amber-100',
  red: 'text-red-700 bg-red-100',
  purple: 'text-purple-700 bg-purple-100',
  cyan: 'text-cyan-700 bg-cyan-100',
};

const dotClasses: Record<Tone, string> = {
  gray: 'bg-gray-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
};

export function Badge({ className, tone = 'gray', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', toneClasses[tone], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  );
}
