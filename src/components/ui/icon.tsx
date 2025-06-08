import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const iconSizes = {
  xs: 'w-3 h-3', // 12px
  sm: 'w-4 h-4', // 16px
  md: 'w-5 h-5', // 20px (padrão)
  lg: 'w-6 h-6', // 24px
  xl: 'w-8 h-8', // 32px
};

export function Icon({
  icon: IconComponent,
  size = 'md',
  className,
}: IconProps) {
  return (
    <IconComponent
      className={cn(iconSizes[size], className)}
      strokeWidth={1.5}
    />
  );
}
