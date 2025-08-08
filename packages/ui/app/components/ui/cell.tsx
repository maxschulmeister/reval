import { cn } from '@/app/lib/utils';
import { ReactNode } from 'react';

interface CellProps {
  children: ReactNode;
  className?: string;
  borderRight?: boolean;
  borderLeft?: boolean;
}

export const Cell = ({
  children,
  className,
  borderRight = false,
  borderLeft = false,
}: CellProps) => {
  return (
    <div
      className={cn(
        'flex items-center px-8 py-4 gap-x-8',
        borderRight && 'border-r border-border',
        borderLeft && 'border-l border-border',
        className
      )}
    >
      {children}
    </div>
  );
};
