import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  gray: 'text-gray-300 bg-white/5 border border-white/10',
  green: 'text-green-300 bg-green-500/10 border border-green-500/20',
  blue: 'text-blue-300 bg-blue-500/10 border border-blue-500/20',
  amber: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
  red: 'text-red-300 bg-red-500/10 border border-red-500/20',
  purple: 'text-purple-300 bg-purple-500/10 border border-purple-500/20',
  cyan: 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20',
};

const dotClasses: Record<Tone, string> = {
  gray: 'bg-gray-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  purple: 'bg-purple-400',
  cyan: 'bg-cyan-400',
};

export function Badge({ className, tone = 'gray', dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', toneClasses[tone], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  );
}
