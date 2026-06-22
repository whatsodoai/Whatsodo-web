import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'input appearance-none cursor-pointer bg-surface-900',
          className
        )}
        {...props}
      />
    );
  }
);
Select.displayName = 'Select';
