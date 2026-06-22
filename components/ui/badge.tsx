import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  gray: 'text-gray-900 bg-white',
  green: 'text-white bg-green-500',
  blue: 'text-white bg-blue-500',
  amber: 'text-white bg-amber-500',
  red: 'text-white bg-red-500',
  purple: 'text-white bg-purple-500',
  cyan: 'text-white bg-cyan-500',
};

const dotClasses: Record<Tone, string> = {
  gray: 'bg-gray-900',
  green: 'bg-white/80',
  blue: 'bg-white/80',
  amber: 'bg-white/80',
  red: 'bg-white/80',
  purple: 'bg-white/80',
  cyan: 'bg-white/80',
};

export function Badge({ className, tone = 'gray', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', toneClasses[tone], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  );
}
