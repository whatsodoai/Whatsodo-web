import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LeadStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  'New Lead': {
    label: 'New Lead',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  Contacted: {
    label: 'Contacted',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
  },
  Qualified: {
    label: 'Qualified',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
  },
  'Appointment Booked': {
    label: 'Appt Booked',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    dot: 'bg-orange-500',
  },
  Won: {
    label: 'Won',
    color: 'text-green-700',
    bg: 'bg-green-50',
    dot: 'bg-green-500',
  },
  Lost: {
    label: 'Lost',
    color: 'text-red-700',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
  },
};

export const LEAD_STATUSES: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Appointment Booked',
  'Won',
  'Lost',
];

export function avatarColor(name: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}
